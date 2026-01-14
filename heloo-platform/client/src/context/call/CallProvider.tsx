/**
 * CallProvider
 * 
 * Provider component that composes call hooks.
 * @module context/call/CallProvider
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type SimplePeer from 'simple-peer'
import { useLocalStream } from '@/hooks/call/useLocalStream'
import { usePeerMesh } from '@/hooks/call/peerMesh'
import { useCallSignaling } from '@/hooks/call/useCallSignaling'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'

import { CallContext } from './context'
import { useCallActions } from './useCallActions'
import { useSignalingHandlers } from './useSignalingHandlers'
import type { CallStatus, CallContextType, CallRefs } from './types'

interface CallProviderProps {
    children: React.ReactNode
}

export function CallProvider({ children }: CallProviderProps) {
    // Auth state
    const { user, profile } = useAuthStore()
    const userId = user?.id || null
    const username = profile?.full_name || profile?.username || 'User'
    const avatarUrl = profile?.avatar_url ?? undefined

    // State
    const [callStatus, setCallStatus] = useState<CallStatus>('idle')
    const [callType, setCallType] = useState<'dm' | 'group' | null>(null)
    const [roomId, setRoomId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Refs
    const refs: CallRefs = {
        isMountedRef: useRef(true),
        callStatusRef: useRef<CallStatus>('idle'),
        roomIdRef: useRef<string | null>(null),
        targetUserIdRef: useRef<string | null>(null),
        isCleaningUpRef: useRef(false),
        isRoomReadyRef: useRef(false),
        pendingPeersToCreate: useRef([]),
        localStreamRef: useRef<MediaStream | null>(null),
    }

    // Keep refs in sync
    useEffect(() => { refs.callStatusRef.current = callStatus }, [callStatus])
    useEffect(() => { refs.roomIdRef.current = roomId }, [roomId])
    useEffect(() => {
        refs.isMountedRef.current = true
        return () => { refs.isMountedRef.current = false }
    }, [])

    // Local Stream Hook
    const localStreamHook = useLocalStream({ audio: true, video: true })

    // Handle signal sending
    const handleSignalSend = useCallback((peerId: string, signalData: SimplePeer.SignalData) => {
        const type = signalData.type === 'offer' ? 'offer'
            : signalData.type === 'answer' ? 'answer'
                : 'ice-candidate'
        signalingHook.sendSignal(peerId, signalData, type)
    }, [])

    // Peer Mesh Hook
    const peerMeshHook = usePeerMesh({
        userId,
        localStream: localStreamHook.stream,
        onSignal: handleSignalSend,
        onConnect: (peerId) => {
            logger.info('CallContext:onConnect', 'Peer connected', { peerId })
            if (refs.isMountedRef.current && refs.callStatusRef.current !== 'connected') {
                setCallStatus('connected')
            }
        },
        onStream: (peerId) => {
            logger.info('CallContext:onStream', 'Remote stream received', { peerId })
        },
        onClose: (peerId) => {
            logger.info('CallContext:onClose', 'Peer closed', { peerId })
        },
        onError: (peerId, err) => {
            logger.error('CallContext:onError', 'Peer error', { peerId, error: err.message })
        },
    })

    // Signaling handlers
    const signalingHandlers = useSignalingHandlers({
        userId,
        refs,
        peerMeshHook,
        localStreamHook,
    })

    // Signaling Hook
    const signalingHook = useCallSignaling({
        userId,
        username,
        avatarUrl,
        onSignalReceived: signalingHandlers.onSignalReceived,
        onPeerJoined: signalingHandlers.onPeerJoined,
        onPeerLeft: signalingHandlers.onPeerLeft,
        onConnectionStateChange: signalingHandlers.onConnectionStateChange,
    })

    // Call actions
    const actions = useCallActions({
        userId,
        refs,
        localStreamHook,
        peerMeshHook,
        signalingHook,
        setCallStatus,
        setCallType,
        setRoomId,
        setError,
    })

    // Update call status on incoming call
    useEffect(() => {
        if (signalingHook.incomingCall && callStatus === 'idle') {
            setCallStatus('receiving')
            refs.targetUserIdRef.current = signalingHook.incomingCall.caller.id
            refs.roomIdRef.current = signalingHook.incomingCall.roomId
        } else if (!signalingHook.incomingCall && callStatus === 'receiving') {
            setCallStatus('idle')
            refs.targetUserIdRef.current = null
            refs.roomIdRef.current = null
        }
    }, [signalingHook.incomingCall, callStatus])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            logger.info('CallContext:unmount', 'Provider unmounting, cleaning up')
            peerMeshHook.destroyAllPeers()
            localStreamHook.stopStream()
            signalingHook.leaveRoom()
        }
    }, [])

    // Context value
    const contextValue = useMemo<CallContextType>(() => ({
        callStatus,
        callType,
        roomId,
        myStream: localStreamHook.stream,
        peers: peerMeshHook.peers,
        incomingCall: signalingHook.incomingCall,
        isAudioMuted: localStreamHook.isAudioMuted,
        isVideoMuted: localStreamHook.isVideoMuted,
        isScreenSharing: localStreamHook.isScreenSharing,
        error,
        startGroupCall: actions.startGroupCall,
        startDMCall: actions.startDMCall,
        joinCall: actions.joinCall,
        endCall: actions.endCall,
        toggleAudio: localStreamHook.toggleAudio,
        toggleVideo: localStreamHook.toggleVideo,
        toggleScreenShare: localStreamHook.toggleScreenShare,
        switchCamera: localStreamHook.switchCamera,
        answerCall: actions.answerCall,
        declineCall: actions.declineCall,
    }), [
        callStatus, callType, roomId, error,
        localStreamHook.stream, localStreamHook.isAudioMuted, localStreamHook.isVideoMuted, localStreamHook.isScreenSharing,
        localStreamHook.toggleAudio, localStreamHook.toggleVideo, localStreamHook.toggleScreenShare, localStreamHook.switchCamera,
        peerMeshHook.peers, signalingHook.incomingCall,
        actions.startGroupCall, actions.startDMCall, actions.joinCall, actions.endCall, actions.answerCall, actions.declineCall,
    ])

    return (
        <CallContext.Provider value={contextValue}>
            {children}
        </CallContext.Provider>
    )
}
