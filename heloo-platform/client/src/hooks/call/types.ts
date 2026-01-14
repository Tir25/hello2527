/**
 * Call Signaling Types
 * 
 * Type definitions for useCallSignaling hook.
 * @module hooks/call/types
 */

import type { SignalPayload, SignalingConnectionState, PeerMetadata } from '@/types/webrtc'
import type { SignalingService } from '@/services/webrtc/signaling'

export interface IncomingCall {
    roomId: string
    caller: {
        id: string
        name: string
        avatar?: string
    }
    isGroup: boolean
    isVideo: boolean
    timestamp: number
}

export interface UseCallSignalingOptions {
    /** Current user ID */
    userId: string | null
    /** Username for display */
    username?: string
    /** Avatar URL */
    avatarUrl?: string
    /** Called when a signal is received */
    onSignalReceived?: (payload: SignalPayload) => void
    /** Called when a peer joins the room */
    onPeerJoined?: (peerId: string, metadata?: PeerMetadata) => void
    /** Called when a peer leaves the room */
    onPeerLeft?: (peerId: string) => void
    /** Called when connection state changes */
    onConnectionStateChange?: (state: SignalingConnectionState) => void
}

export interface UseCallSignalingReturn {
    /** Current incoming call (null if none) */
    incomingCall: IncomingCall | null
    /** Current room ID (null if not in a room) */
    currentRoomId: string | null
    /** Connection state */
    connectionState: SignalingConnectionState
    /** Whether currently connected to a room */
    isConnected: boolean
    /** Initialize the signaling service */
    initialize: () => Promise<void>
    /** Join a signaling room */
    joinRoom: (roomId: string) => Promise<void>
    /** Leave the current room */
    leaveRoom: () => Promise<void>
    /** Send a signal to a peer */
    sendSignal: (peerId: string, signalData: object, type: 'offer' | 'answer' | 'ice-candidate') => Promise<void>
    /** Call a user */
    callUser: (targetUserId: string, roomId: string, isVideo?: boolean) => Promise<void>
    /** Cancel a call */
    cancelCall: (targetUserId: string, roomId: string, reason?: 'caller_ended' | 'declined' | 'timeout') => Promise<void>
    /** Accept an incoming call */
    acceptCall: () => void
    /** Decline an incoming call */
    declineCall: () => Promise<void>
    /** Clear incoming call state */
    clearIncomingCall: () => void
    /** The signaling service instance */
    signalingService: SignalingService
}

export interface SignalingRefs {
    isMounted: React.MutableRefObject<boolean>
    userId: React.MutableRefObject<string | null>
    username: React.MutableRefObject<string | undefined>
    avatarUrl: React.MutableRefObject<string | undefined>
    onSignalReceived: React.MutableRefObject<((payload: SignalPayload) => void) | undefined>
    onPeerJoined: React.MutableRefObject<((peerId: string, metadata?: PeerMetadata) => void) | undefined>
    onPeerLeft: React.MutableRefObject<((peerId: string) => void) | undefined>
    onConnectionStateChange: React.MutableRefObject<((state: SignalingConnectionState) => void) | undefined>
}
