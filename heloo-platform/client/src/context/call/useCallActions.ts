/**
 * useCallActions Hook
 * 
 * All call action handlers extracted into a reusable hook.
 * @module context/call/useCallActions
 */

import { useCallback } from 'react'
import type { UseLocalStreamReturn } from '@/hooks/call/useLocalStream'
import type { UsePeerMeshReturn } from '@/hooks/call/peerMesh'
import type { UseCallSignalingReturn } from '@/hooks/call/useCallSignaling'
import type { CallStatus, CallRefs } from './types'
import { generateDMRoomId } from '@/types/webrtc'
import { logger } from '@/lib/logger'

interface UseCallActionsOptions {
    userId: string | null
    refs: CallRefs
    localStreamHook: UseLocalStreamReturn
    peerMeshHook: UsePeerMeshReturn
    signalingHook: UseCallSignalingReturn
    setCallStatus: (status: CallStatus) => void
    setCallType: (type: 'dm' | 'group' | null) => void
    setRoomId: (roomId: string | null) => void
    setError: (error: string | null) => void
}

export function useCallActions(options: UseCallActionsOptions) {
    const {
        userId,
        refs,
        localStreamHook,
        peerMeshHook,
        signalingHook,
        setCallStatus,
        setCallType,
        setRoomId,
        setError,
    } = options

    const processPendingPeers = useCallback((currentStream: MediaStream) => {
        if (refs.pendingPeersToCreate.current.length > 0) {
            logger.info('CallContext:processPendingPeers', 'Processing pending peers', {
                count: refs.pendingPeersToCreate.current.length,
            })
            for (const { peerId } of refs.pendingPeersToCreate.current) {
                if (!peerMeshHook.hasPeer(peerId)) {
                    const shouldBeInitiator = userId ? userId < peerId : false
                    peerMeshHook.createPeer(peerId, shouldBeInitiator, currentStream)
                }
            }
            refs.pendingPeersToCreate.current = []
        }
    }, [userId, peerMeshHook, refs])

    const fullCleanup = useCallback(async () => {
        if (refs.isCleaningUpRef.current) return
        refs.isCleaningUpRef.current = true

        logger.info('CallContext:fullCleanup', 'Starting full cleanup')

        if (refs.targetUserIdRef.current && refs.roomIdRef.current) {
            try {
                await signalingHook.cancelCall(refs.targetUserIdRef.current, refs.roomIdRef.current, 'caller_ended')
            } catch { /* ignore */ }
        }

        peerMeshHook.destroyAllPeers()
        localStreamHook.stopStream()
        await signalingHook.leaveRoom()

        if (refs.isMountedRef.current) {
            setCallStatus('idle')
            setCallType(null)
            setRoomId(null)
            setError(null)
        }

        refs.targetUserIdRef.current = null
        refs.roomIdRef.current = null
        refs.isCleaningUpRef.current = false
        refs.isRoomReadyRef.current = false
        refs.pendingPeersToCreate.current = []

        logger.info('CallContext:fullCleanup', 'Cleanup complete')
    }, [refs, peerMeshHook, localStreamHook, signalingHook, setCallStatus, setCallType, setRoomId, setError])

    const startDMCall = useCallback(async (targetUserId: string) => {
        if (refs.callStatusRef.current !== 'idle') throw new Error('Already in a call')

        logger.info('CallContext:startDMCall', 'Starting DM call', { targetUserId, userId })

        try {
            const stream = await localStreamHook.initializeStream()
            refs.localStreamRef.current = stream

            const dmRoomId = generateDMRoomId(userId!, targetUserId)
            refs.targetUserIdRef.current = targetUserId
            refs.roomIdRef.current = dmRoomId

            if (refs.isMountedRef.current) {
                setCallStatus('calling')
                setCallType('dm')
                setRoomId(dmRoomId)
            }
            refs.callStatusRef.current = 'calling'

            await signalingHook.joinRoom(dmRoomId)
            refs.isRoomReadyRef.current = true
            if (refs.localStreamRef.current) processPendingPeers(refs.localStreamRef.current)

            await signalingHook.callUser(targetUserId, dmRoomId)
            logger.info('CallContext:startDMCall', 'DM call started')
        } catch (e) {
            logger.error('CallContext:startDMCall', 'Failed', e)
            if (refs.isMountedRef.current) setError(e instanceof Error ? e.message : 'Failed to start call')
            await fullCleanup()
            throw e
        }
    }, [userId, refs, localStreamHook, signalingHook, processPendingPeers, fullCleanup, setCallStatus, setCallType, setRoomId, setError])

    const startGroupCall = useCallback(async (groupId: string) => {
        if (refs.callStatusRef.current !== 'idle') throw new Error('Already in a call')

        logger.info('CallContext:startGroupCall', 'Starting group call', { groupId })

        try {
            const stream = await localStreamHook.initializeStream()
            refs.localStreamRef.current = stream

            const groupRoomId = `group:${groupId}`
            refs.roomIdRef.current = groupRoomId

            if (refs.isMountedRef.current) {
                setCallStatus('calling')
                setCallType('group')
                setRoomId(groupRoomId)
            }
            refs.callStatusRef.current = 'calling'

            await signalingHook.joinRoom(groupRoomId)
            refs.isRoomReadyRef.current = true
            if (refs.localStreamRef.current) processPendingPeers(refs.localStreamRef.current)

            logger.info('CallContext:startGroupCall', 'Group call started')
        } catch (e) {
            logger.error('CallContext:startGroupCall', 'Failed', e)
            if (refs.isMountedRef.current) setError(e instanceof Error ? e.message : 'Failed to start call')
            await fullCleanup()
            throw e
        }
    }, [refs, localStreamHook, signalingHook, processPendingPeers, fullCleanup, setCallStatus, setCallType, setRoomId, setError])

    const joinCall = useCallback(async (targetRoomId?: string) => {
        const roomToJoin = targetRoomId || signalingHook.incomingCall?.roomId
        if (!roomToJoin) throw new Error('No room to join')
        if (refs.callStatusRef.current !== 'idle' && refs.callStatusRef.current !== 'receiving') {
            throw new Error('Already in a call')
        }

        logger.info('CallContext:joinCall', 'Joining call', { targetRoomId: roomToJoin })

        try {
            const stream = await localStreamHook.initializeStream()
            refs.localStreamRef.current = stream
            refs.roomIdRef.current = roomToJoin

            if (signalingHook.incomingCall) {
                refs.targetUserIdRef.current = signalingHook.incomingCall.caller.id
            }

            if (refs.isMountedRef.current) {
                setCallStatus('connecting')
                setRoomId(roomToJoin)
            }
            refs.callStatusRef.current = 'connecting'

            await signalingHook.joinRoom(roomToJoin)
            refs.isRoomReadyRef.current = true
            if (refs.localStreamRef.current) processPendingPeers(refs.localStreamRef.current)

            signalingHook.clearIncomingCall()
            logger.info('CallContext:joinCall', 'Joined call')
        } catch (e) {
            logger.error('CallContext:joinCall', 'Failed', e)
            if (refs.isMountedRef.current) setError(e instanceof Error ? e.message : 'Failed to join call')
            await fullCleanup()
            throw e
        }
    }, [refs, localStreamHook, signalingHook, processPendingPeers, fullCleanup, setCallStatus, setRoomId, setError])

    const endCall = useCallback(async () => {
        logger.info('CallContext:endCall', 'Ending call')
        await fullCleanup()
    }, [fullCleanup])

    const answerCall = useCallback(async () => {
        if (!signalingHook.incomingCall) throw new Error('No incoming call to answer')
        logger.info('CallContext:answerCall', 'Answering call', { roomId: signalingHook.incomingCall.roomId })
        await joinCall(signalingHook.incomingCall.roomId)
    }, [signalingHook.incomingCall, joinCall])

    const declineCall = useCallback(async () => {
        await signalingHook.declineCall()
    }, [signalingHook])

    return {
        startDMCall,
        startGroupCall,
        joinCall,
        endCall,
        answerCall,
        declineCall,
        fullCleanup,
    }
}
