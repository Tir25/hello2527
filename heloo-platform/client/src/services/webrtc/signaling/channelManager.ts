/**
 * Channel Management
 * 
 * Handles Supabase Realtime channel creation and subscription.
 * @module services/webrtc/signaling/channelManager
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { SignalingState } from './types'
import type { PeerMetadata, SignalPayload } from '@/types/webrtc'
import { CHANNEL_PREFIX, PRESENCE_SYNC_TIMEOUT } from './types'
import { createSignalingError } from './createError'

export interface ChannelHandlers {
    onIncomingSignal: (payload: SignalPayload) => void
    onPresenceSync: () => void
    onPresenceJoin: (key: string, newPresences: Array<{ [key: string]: unknown }>) => void
    onPresenceLeave: (key: string, leftPresences: Array<{ [key: string]: unknown }>) => void
    onChannelClosed: () => void
    updateConnectionState: (state: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error') => void
}

/**
 * Create and subscribe to Supabase Realtime channel
 */
export async function createChannel(
    state: SignalingState,
    roomId: string,
    userId: string,
    handlers: ChannelHandlers
): Promise<void> {
    const channelName = `${CHANNEL_PREFIX}${roomId}`

    logger.info('signaling:createChannel', 'Creating channel', { channelName })

    state.channel = supabase.channel(channelName, {
        config: {
            broadcast: { self: state.config.enableSelfBroadcast ?? false },
            presence: { key: userId },
        },
    })

    // Setup handlers
    state.channel.on('broadcast', { event: 'signal' }, (payload) => {
        handlers.onIncomingSignal(payload.payload as SignalPayload)
    })

    state.channel.on('presence', { event: 'sync' }, () => {
        handlers.onPresenceSync()
    })

    state.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        handlers.onPresenceJoin(key, newPresences)
    })

    state.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        handlers.onPresenceLeave(key, leftPresences)
    })

    // Subscribe to channel
    return new Promise<void>((resolve, reject) => {
        let hasResolved = false

        const timeout = setTimeout(() => {
            if (hasResolved) return
            hasResolved = true
            reject(createSignalingError('CONNECTION_FAILED', 'Channel subscription timed out'))
        }, PRESENCE_SYNC_TIMEOUT)

        state.channel!.subscribe(async (status) => {
            logger.info('signaling:subscribe', 'Channel status changed', { status })

            if (hasResolved) {
                if (status === 'CLOSED') handlers.onChannelClosed()
                return
            }

            if (status === 'SUBSCRIBED') {
                clearTimeout(timeout)
                try {
                    await state.channel!.track({
                        userId,
                        username: state.peerMetadata.username,
                        avatarUrl: state.peerMetadata.avatarUrl,
                        joinedAt: Date.now(),
                        deviceType: state.peerMetadata.deviceType || 'desktop',
                        isMuted: state.peerMetadata.isMuted ?? false,
                        isVideoOff: state.peerMetadata.isVideoOff ?? false,
                    })

                    state.connectedAt = Date.now()
                    state.reconnectAttempts = 0
                    handlers.updateConnectionState('connected')
                    hasResolved = true
                    resolve()
                } catch (error) {
                    hasResolved = true
                    reject(createSignalingError('PRESENCE_ERROR', 'Failed to track presence', { error }))
                }
            } else if (status === 'CHANNEL_ERROR') {
                clearTimeout(timeout)
                hasResolved = true
                reject(createSignalingError('CHANNEL_ERROR', 'Channel subscription failed'))
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
                clearTimeout(timeout)
                hasResolved = true
                reject(createSignalingError('CONNECTION_FAILED', `Channel ${status.toLowerCase()}`))
            }
        })
    })
}

/**
 * Leave the current room
 */
export async function leaveRoom(state: SignalingState): Promise<void> {
    if (state.isDestroyed || !state.channel) {
        return
    }

    const roomId = state.currentRoomId
    const channelToRemove = state.channel
    logger.info('signaling:leaveRoom', 'Leaving room', { roomId })

    if (state.reconnectTimeout) {
        clearTimeout(state.reconnectTimeout)
        state.reconnectTimeout = null
    }

    // Clear state BEFORE removing channel
    state.channel = null
    state.currentUserId = null
    state.currentRoomId = null
    state.roomInfo = null
    state.participants.clear()
    state.connectedAt = null
    state.reconnectAttempts = 0
    state.connectionState = 'disconnected'

    try {
        await channelToRemove.untrack()
    } catch (error) {
        logger.warn('signaling:leaveRoom', 'Failed to untrack presence', error)
    }

    try {
        await supabase.removeChannel(channelToRemove)
    } catch (error) {
        logger.warn('signaling:leaveRoom', 'Failed to remove channel', error)
    }

    logger.info('signaling:leaveRoom', 'Successfully left room', { roomId })
}

/**
 * Update presence metadata
 */
export async function updatePresence(
    state: SignalingState,
    metadata: Partial<PeerMetadata>
): Promise<void> {
    if (state.isDestroyed) {
        throw createSignalingError('CHANNEL_ERROR', 'Service has been destroyed')
    }

    if (!state.channel || state.connectionState !== 'connected') {
        throw createSignalingError('NOT_CONNECTED', 'Not connected to a room')
    }

    state.peerMetadata = { ...state.peerMetadata, ...metadata }

    await state.channel.track({
        userId: state.currentUserId,
        ...state.peerMetadata,
        joinedAt: state.peerMetadata.joinedAt || Date.now(),
    })

    logger.debug('signaling:updatePresence', 'Presence updated', metadata)
}
