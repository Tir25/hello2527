/**
 * useCallSignaling Hook
 * 
 * Connects SignalingService events to the peer mesh for WebRTC signaling.
 * Handles room joining/leaving, incoming calls, and signal routing.
 * 
 * @module hooks/call/useCallSignaling
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { SignalingService, type IncomingCallPayload, type CallCancelledPayload } from '@/services/webrtc/signaling'
import { logger } from '@/lib/logger'
import type { SignalPayload, SignalingConnectionState, PeerMetadata } from '@/types/webrtc'
import type { UseCallSignalingOptions, UseCallSignalingReturn, IncomingCall, SignalingRefs } from './types'
import { useSignalingActions } from './useSignalingActions'

// Re-export types for convenience
export type { IncomingCall, UseCallSignalingOptions, UseCallSignalingReturn } from './types'

/**
 * Hook for managing WebRTC signaling
 */
export function useCallSignaling(options: UseCallSignalingOptions): UseCallSignalingReturn {
    const { userId, username, avatarUrl, onSignalReceived, onPeerJoined, onPeerLeft, onConnectionStateChange } = options

    // State
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
    const [connectionState, setConnectionState] = useState<SignalingConnectionState>('disconnected')
    const [isInitialized, setIsInitialized] = useState(false)

    // Refs
    const refs: SignalingRefs = {
        isMounted: useRef(true),
        userId: useRef(userId),
        username: useRef(username),
        avatarUrl: useRef(avatarUrl),
        onSignalReceived: useRef(onSignalReceived),
        onPeerJoined: useRef(onPeerJoined),
        onPeerLeft: useRef(onPeerLeft),
        onConnectionStateChange: useRef(onConnectionStateChange),
    }

    // Create stable signaling service instance
    const signalingService = useMemo(() => new SignalingService(), [])

    // Update refs when props change
    useEffect(() => { refs.userId.current = userId }, [userId])
    useEffect(() => { refs.username.current = username }, [username])
    useEffect(() => { refs.avatarUrl.current = avatarUrl }, [avatarUrl])
    useEffect(() => { refs.onSignalReceived.current = onSignalReceived }, [onSignalReceived])
    useEffect(() => { refs.onPeerJoined.current = onPeerJoined }, [onPeerJoined])
    useEffect(() => { refs.onPeerLeft.current = onPeerLeft }, [onPeerLeft])
    useEffect(() => { refs.onConnectionStateChange.current = onConnectionStateChange }, [onConnectionStateChange])

    // Track mounted state
    useEffect(() => {
        refs.isMounted.current = true
        return () => { refs.isMounted.current = false }
    }, [])

    // Computed state
    const isConnected = connectionState === 'connected'

    // Actions from extracted hook
    const actions = useSignalingActions({
        signalingService,
        refs,
        incomingCall,
        setCurrentRoomId,
        setIncomingCall,
    })

    /**
     * Initialize the signaling service
     */
    const initialize = useCallback(async () => {
        if (!refs.userId.current || isInitialized) return

        try {
            logger.info('useCallSignaling:initialize', 'Initializing signaling service', {
                userId: refs.userId.current,
            })

            // Event listeners
            signalingService.onSignal((payload: SignalPayload) => {
                refs.onSignalReceived.current?.(payload)
            })

            signalingService.onPeerJoined((peerId: string, metadata?: PeerMetadata) => {
                refs.onPeerJoined.current?.(peerId, metadata)
            })

            signalingService.onPeerLeft((peerId: string) => {
                refs.onPeerLeft.current?.(peerId)
            })

            signalingService.onConnectionStateChange((state) => {
                if (refs.isMounted.current) setConnectionState(state)
                refs.onConnectionStateChange.current?.(state)
            })

            signalingService.onIncomingCall((payload: IncomingCallPayload) => {
                logger.info('useCallSignaling:onIncomingCall', 'Incoming call', { caller: payload.caller.name })
                if (refs.isMounted.current) {
                    setIncomingCall({
                        roomId: payload.roomId,
                        caller: payload.caller,
                        isGroup: payload.isGroup,
                        isVideo: payload.isVideo,
                        timestamp: payload.timestamp,
                    })
                }
            })

            signalingService.onCallCancelled((payload: CallCancelledPayload) => {
                logger.info('useCallSignaling:onCallCancelled', 'Call cancelled', { reason: payload.reason })
                if (refs.isMounted.current) setIncomingCall(null)
            })

            await signalingService.initialize(refs.userId.current)
            if (refs.isMounted.current) setIsInitialized(true)
            logger.info('useCallSignaling:initialize', 'Signaling service initialized')
        } catch (err) {
            logger.error('useCallSignaling:initialize', 'Failed to initialize signaling', err)
            throw err
        }
    }, [signalingService, isInitialized])

    // Auto-initialize when userId is available
    useEffect(() => {
        if (userId && !isInitialized) {
            initialize()
        }
    }, [userId, isInitialized, initialize])

    // Cleanup on unmount
    useEffect(() => {
        return () => { signalingService.leaveRoom() }
    }, [signalingService])

    return {
        incomingCall,
        currentRoomId,
        connectionState,
        isConnected,
        initialize,
        ...actions,
        signalingService,
    }
}

export default useCallSignaling
