/**
 * useSignalingHandlers Hook
 * 
 * Signaling event handlers for the call context.
 * @module context/call/useSignalingHandlers
 */

import { useCallback } from 'react'
import type SimplePeer from 'simple-peer'
import type { UsePeerMeshReturn } from '@/hooks/call/peerMesh'
import type { UseLocalStreamReturn } from '@/hooks/call/useLocalStream'
import type { SignalPayload, PeerMetadata, SignalingConnectionState } from '@/types/webrtc'
import type { CallRefs } from './types'
import { logger } from '@/lib/logger'

interface UseSignalingHandlersOptions {
    userId: string | null
    refs: CallRefs
    peerMeshHook: UsePeerMeshReturn
    localStreamHook: UseLocalStreamReturn
}

export function useSignalingHandlers(options: UseSignalingHandlersOptions) {
    const { userId, refs, peerMeshHook, localStreamHook } = options

    const onSignalReceived = useCallback((payload: SignalPayload) => {
        const signalData = payload.signalData as SimplePeer.SignalData
        const senderId = payload.senderId
        const type = payload.type

        logger.debug('CallContext:handleIncomingSignal', 'Received signal', { senderId, type })

        if (peerMeshHook.hasPeer(senderId)) {
            peerMeshHook.signalPeer(senderId, signalData)
        } else if (type === 'offer' && localStreamHook.stream) {
            peerMeshHook.createPeer(senderId, false, localStreamHook.stream, signalData)
        } else {
            peerMeshHook.signalPeer(senderId, signalData)
        }
    }, [peerMeshHook, localStreamHook.stream])

    const onPeerJoined = useCallback((peerId: string, metadata?: PeerMetadata) => {
        logger.info('CallContext:onPeerJoined', 'Peer joined', { peerId, metadata })

        if (refs.isCleaningUpRef.current) return
        if (peerMeshHook.hasPeer(peerId)) {
            logger.debug('CallContext:onPeerJoined', 'Peer already exists, skipping', { peerId })
            return
        }

        if (!refs.isRoomReadyRef.current) {
            logger.debug('CallContext:onPeerJoined', 'Room not ready, queueing peer', { peerId })
            refs.pendingPeersToCreate.current.push({ peerId, metadata })
            return
        }

        const currentStream = refs.localStreamRef.current
        if (currentStream && refs.callStatusRef.current !== 'idle') {
            const shouldBeInitiator = userId ? userId < peerId : false
            logger.debug('CallContext:onPeerJoined', 'Creating peer', { peerId, initiator: shouldBeInitiator })
            peerMeshHook.createPeer(peerId, shouldBeInitiator, currentStream)
        } else {
            logger.debug('CallContext:onPeerJoined', 'Cannot create peer - no stream or idle')
        }
    }, [userId, refs, peerMeshHook])

    const onPeerLeft = useCallback((peerId: string) => {
        logger.info('CallContext:onPeerLeft', 'Peer left', { peerId })
        peerMeshHook.removePeer(peerId)
    }, [peerMeshHook])

    const onConnectionStateChange = useCallback((state: SignalingConnectionState) => {
        logger.info('CallContext:connectionStateChange', 'State changed', { state })
    }, [])

    return {
        onSignalReceived,
        onPeerJoined,
        onPeerLeft,
        onConnectionStateChange,
    }
}
