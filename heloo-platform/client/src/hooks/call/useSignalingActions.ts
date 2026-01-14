/**
 * useSignalingActions Hook
 * 
 * Extracted action callbacks for signaling operations.
 * @module hooks/call/useSignalingActions
 */

import { useCallback } from 'react'
import type { SignalingService } from '@/services/webrtc/signaling'
import type { SignalingRefs, IncomingCall } from './types'
import { logger } from '@/lib/logger'

interface UseSignalingActionsOptions {
    signalingService: SignalingService
    refs: SignalingRefs
    incomingCall: IncomingCall | null
    setCurrentRoomId: (roomId: string | null) => void
    setIncomingCall: (call: IncomingCall | null) => void
}

export function useSignalingActions({
    signalingService,
    refs,
    incomingCall,
    setCurrentRoomId,
    setIncomingCall,
}: UseSignalingActionsOptions) {
    /**
     * Join a signaling room
     */
    const joinRoom = useCallback(async (roomId: string) => {
        if (!refs.userId.current) {
            throw new Error('User ID required to join room')
        }

        logger.info('useCallSignaling:joinRoom', 'Joining room', { roomId })

        await signalingService.joinRoom(roomId, refs.userId.current, {
            metadata: {
                userId: refs.userId.current,
                username: refs.username.current,
                avatarUrl: refs.avatarUrl.current,
            },
        })

        if (refs.isMounted.current) {
            setCurrentRoomId(roomId)
        }
    }, [signalingService, refs, setCurrentRoomId])

    /**
     * Leave the current room
     */
    const leaveRoom = useCallback(async () => {
        logger.info('useCallSignaling:leaveRoom', 'Leaving room')
        await signalingService.leaveRoom()

        if (refs.isMounted.current) {
            setCurrentRoomId(null)
        }
    }, [signalingService, refs, setCurrentRoomId])

    /**
     * Send a signal to a peer
     */
    const sendSignal = useCallback(async (
        peerId: string,
        signalData: object,
        type: 'offer' | 'answer' | 'ice-candidate'
    ) => {
        await signalingService.sendSignalToPeer(peerId, type, signalData)
    }, [signalingService])

    /**
     * Call a user
     */
    const callUser = useCallback(async (targetUserId: string, roomId: string, isVideo = true) => {
        if (!refs.userId.current) {
            throw new Error('User ID required to make a call')
        }

        await signalingService.callUser(
            targetUserId,
            roomId,
            {
                id: refs.userId.current,
                name: refs.username.current || 'User',
                avatar: refs.avatarUrl.current,
            },
            false, // isGroup
            isVideo
        )
    }, [signalingService, refs])

    /**
     * Cancel a call
     */
    const cancelCall = useCallback(async (
        targetUserId: string,
        roomId: string,
        reason: 'caller_ended' | 'declined' | 'timeout' = 'caller_ended'
    ) => {
        await signalingService.cancelCall(targetUserId, roomId, reason)
    }, [signalingService])

    /**
     * Accept an incoming call
     */
    const acceptCall = useCallback(() => {
        if (refs.isMounted.current) {
            setIncomingCall(null)
        }
    }, [refs, setIncomingCall])

    /**
     * Decline an incoming call
     */
    const declineCall = useCallback(async () => {
        if (!incomingCall) return

        await signalingService.cancelCall(
            incomingCall.caller.id,
            incomingCall.roomId,
            'declined'
        )

        if (refs.isMounted.current) {
            setIncomingCall(null)
        }
    }, [incomingCall, signalingService, refs, setIncomingCall])

    /**
     * Clear incoming call state
     */
    const clearIncomingCall = useCallback(() => {
        if (refs.isMounted.current) {
            setIncomingCall(null)
        }
    }, [refs, setIncomingCall])

    return {
        joinRoom,
        leaveRoom,
        sendSignal,
        callUser,
        cancelCall,
        acceptCall,
        declineCall,
        clearIncomingCall,
    }
}
