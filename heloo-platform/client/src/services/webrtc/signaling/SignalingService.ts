/**
 * SignalingService Class
 * 
 * Production-grade WebRTC signaling service using Supabase Realtime.
 * @module services/webrtc/signaling/SignalingService
 */

import { logger } from '@/lib/logger'
import type {
    ISignalingProvider,
    SignalPayload,
    SignalType,
    SignalingConnectionState,
    SignalingConnectionInfo,
    SignalingEvents,
    RoomInfo,
    RoomParticipant,
    PeerMetadata,
    JoinRoomOptions,
} from '@/types/webrtc'

import type { SignalingState, IncomingCallCallback, CallCancelledCallback } from './types'
import { DEFAULT_CONFIG } from './types'
import { createSignalingError } from './createError'
import * as personalChannel from './personalChannel'
import * as channelManager from './channelManager'
import * as signalSender from './signalSender'
import * as eventHandlers from './eventHandlers'
import * as reconnection from './reconnection'

export class SignalingService implements ISignalingProvider {
    private state: SignalingState = {
        channel: null,
        currentUserId: null,
        currentRoomId: null,
        connectionState: 'disconnected',
        connectedAt: null,
        lastError: null,
        reconnectAttempts: 0,
        reconnectTimeout: null,
        personalChannel: null,
        personalUserId: null,
        onIncomingCallCallback: null,
        onCallCancelledCallback: null,
        isJoining: false,
        isDestroyed: false,
        roomInfo: null,
        participants: new Map(),
        config: { ...DEFAULT_CONFIG },
        peerMetadata: {},
        onSignalCallback: null,
        onPeerJoinedCallback: null,
        onPeerLeftCallback: null,
        onErrorCallback: null,
        onConnectionStateChangeCallback: null,
        onPresenceSyncCallback: null,
    }

    // ===== Personal Channel =====

    async initialize(userId: string): Promise<void> {
        await personalChannel.initializePersonalChannel(this.state, userId)
    }

    onIncomingCall(callback: IncomingCallCallback): void {
        this.state.onIncomingCallCallback = callback
    }

    onCallCancelled(callback: CallCancelledCallback): void {
        this.state.onCallCancelledCallback = callback
    }

    async callUser(
        targetUserId: string,
        roomId: string,
        caller: { id: string; name: string; avatar?: string },
        isGroup: boolean,
        isVideo: boolean
    ): Promise<void> {
        await personalChannel.callUser(targetUserId, roomId, caller, isGroup, isVideo)
    }

    async cancelCall(
        targetUserId: string,
        roomId: string,
        reason: 'caller_ended' | 'declined' | 'timeout'
    ): Promise<void> {
        await personalChannel.cancelCall(targetUserId, roomId, reason)
    }

    // ===== Room Lifecycle =====

    async joinRoom(roomId: string, userId: string, options: JoinRoomOptions = {}): Promise<void> {
        if (!roomId || !userId) {
            throw createSignalingError('INVALID_SIGNAL', 'Room ID and User ID are required')
        }
        if (!/^[a-zA-Z0-9:_-]+$/.test(roomId)) {
            throw createSignalingError('INVALID_SIGNAL', 'Room ID contains invalid characters')
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
            throw createSignalingError('INVALID_SIGNAL', 'User ID contains invalid characters')
        }
        if (this.state.isDestroyed) {
            throw createSignalingError('CHANNEL_ERROR', 'Service has been destroyed')
        }
        if (this.state.isJoining) {
            throw createSignalingError('ALREADY_CONNECTED', 'Join operation in progress')
        }

        if (this.state.channel && (this.state.connectionState === 'connected' || this.state.connectionState === 'connecting')) {
            if (this.state.currentRoomId === roomId && this.state.currentUserId === userId) {
                return
            }
            await this.leaveRoom()
        }

        this.state.isJoining = true

        try {
            this.updateConnectionState('connecting')
            this.state.currentUserId = userId
            this.state.currentRoomId = roomId
            this.state.peerMetadata = options.metadata || {}
            this.state.config = { ...DEFAULT_CONFIG, ...options.config }
            this.state.roomInfo = {
                roomId,
                participants: [],
                isGroupCall: options.isGroupCall ?? roomId.startsWith('group:'),
                groupId: options.groupId,
                createdAt: Date.now(),
                config: this.state.config,
            }

            await this.createChannelInternal()
            this.state.lastError = null
            logger.info('signaling:joinRoom', 'Joined room', { roomId, userId })
        } catch (error) {
            reconnection.cleanupState(this.state)
            reconnection.handleError(this.state, 'CONNECTION_FAILED', 'Failed to join room', error)
            throw error
        } finally {
            this.state.isJoining = false
        }
    }

    private async createChannelInternal(): Promise<void> {
        const { handleChannelClosed } = reconnection.createReconnectionHandler(
            this.state,
            () => this.createChannelInternal(),
            (s) => this.updateConnectionState(s),
            (c, m, e) => reconnection.handleError(this.state, c, m, e)
        )

        await channelManager.createChannel(
            this.state,
            this.state.currentRoomId!,
            this.state.currentUserId!,
            {
                onIncomingSignal: (p) => eventHandlers.handleIncomingSignal(this.state, p),
                onPresenceSync: () => eventHandlers.handlePresenceSync(this.state),
                onPresenceJoin: (k, n) => eventHandlers.handlePresenceJoin(this.state, k, n),
                onPresenceLeave: (k, l) => eventHandlers.handlePresenceLeave(this.state, k, l),
                onChannelClosed: handleChannelClosed,
                updateConnectionState: (s) => this.updateConnectionState(s),
            }
        )
    }

    async leaveRoom(): Promise<void> {
        await channelManager.leaveRoom(this.state)
    }

    // ===== Signaling =====

    async sendSignal(payload: Omit<SignalPayload, 'timestamp'>): Promise<void> {
        await signalSender.sendSignal(this.state, payload)
    }

    async sendSignalToPeer(peerId: string, type: SignalType, signalData: SignalPayload['signalData']): Promise<void> {
        await signalSender.sendSignalToPeer(this.state, peerId, type, signalData)
    }

    async broadcastSignal(type: SignalType, signalData: SignalPayload['signalData']): Promise<void> {
        await signalSender.broadcastSignal(this.state, type, signalData)
    }

    // ===== Event Registration =====

    onSignal(callback: SignalingEvents['onReceiveSignal']): void {
        if (!this.state.isDestroyed) this.state.onSignalCallback = callback
    }

    onPeerJoined(callback: NonNullable<SignalingEvents['onPeerJoined']>): void {
        if (!this.state.isDestroyed) this.state.onPeerJoinedCallback = callback
    }

    onPeerLeft(callback: NonNullable<SignalingEvents['onPeerLeft']>): void {
        if (!this.state.isDestroyed) this.state.onPeerLeftCallback = callback
    }

    onError(callback: NonNullable<SignalingEvents['onError']>): void {
        if (!this.state.isDestroyed) this.state.onErrorCallback = callback
    }

    onConnectionStateChange(callback: NonNullable<SignalingEvents['onConnectionStateChange']>): void {
        if (!this.state.isDestroyed) this.state.onConnectionStateChangeCallback = callback
    }

    onPresenceSync(callback: NonNullable<SignalingEvents['onPresenceSync']>): void {
        if (!this.state.isDestroyed) this.state.onPresenceSyncCallback = callback
    }

    removeAllListeners(): void {
        this.state.onSignalCallback = null
        this.state.onPeerJoinedCallback = null
        this.state.onPeerLeftCallback = null
        this.state.onErrorCallback = null
        this.state.onConnectionStateChangeCallback = null
        this.state.onPresenceSyncCallback = null
    }

    // ===== State Queries =====

    getConnectionState(): SignalingConnectionState {
        return this.state.connectionState
    }

    getConnectionInfo(): SignalingConnectionInfo {
        return {
            state: this.state.connectionState,
            roomId: this.state.currentRoomId,
            userId: this.state.currentUserId,
            connectedAt: this.state.connectedAt,
            lastError: this.state.lastError,
            reconnectAttempts: this.state.reconnectAttempts,
        }
    }

    getRoomInfo(): RoomInfo | null {
        return this.state.roomInfo
    }

    getCurrentParticipants(): string[] {
        return Array.from(this.state.participants.keys())
    }

    getParticipant(userId: string): RoomParticipant | null {
        return this.state.participants.get(userId) || null
    }

    isConnected(): boolean {
        return this.state.connectionState === 'connected'
    }

    async updatePresence(metadata: Partial<PeerMetadata>): Promise<void> {
        await channelManager.updatePresence(this.state, metadata)
    }

    // ===== Lifecycle =====

    private updateConnectionState(newState: SignalingConnectionState): void {
        reconnection.updateConnectionState(this.state, newState, () => this.getConnectionInfo())
    }

    async destroy(): Promise<void> {
        if (this.state.isDestroyed) return

        logger.info('signaling:destroy', 'Destroying service')
        this.state.isDestroyed = true

        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange)
        }

        if (this.state.reconnectTimeout) {
            clearTimeout(this.state.reconnectTimeout)
            this.state.reconnectTimeout = null
        }

        await personalChannel.cleanupPersonalChannel(this.state)
        await channelManager.leaveRoom(this.state)
        this.removeAllListeners()

        logger.info('signaling:destroy', 'Service destroyed')
    }

    reinitialize(): void {
        if (!this.state.isDestroyed) return

        logger.info('signaling:reinitialize', 'Reinitializing service')
        this.state.isDestroyed = false
        this.state.channel = null
        this.state.currentUserId = null
        this.state.currentRoomId = null
        this.state.connectionState = 'disconnected'
        this.state.connectedAt = null
        this.state.lastError = null
        this.state.reconnectAttempts = 0
        this.state.reconnectTimeout = null
        this.state.isJoining = false
        this.state.roomInfo = null
        this.state.participants.clear()
        this.state.config = { ...DEFAULT_CONFIG }
        this.state.peerMetadata = {}
    }

    private handleVisibilityChange = (): void => {
        if (typeof document === 'undefined' || this.state.isDestroyed) return

        if (document.visibilityState === 'visible') {
            if (this.state.currentRoomId && this.state.currentUserId && this.state.connectionState === 'disconnected') {
                const { attemptReconnect } = reconnection.createReconnectionHandler(
                    this.state,
                    () => this.createChannelInternal(),
                    (s) => this.updateConnectionState(s),
                    (c, m, e) => reconnection.handleError(this.state, c, m, e)
                )
                attemptReconnect()
            }
        }
    }

    enableVisibilityHandling(): void {
        if (!this.state.isDestroyed && typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibilityChange)
        }
    }

    disableVisibilityHandling(): void {
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange)
        }
    }
}
