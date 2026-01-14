/**
 * CallContext Types
 * 
 * Type definitions for call context.
 * @module context/call/types
 */

import type { PeerConnection } from '@/hooks/call/peerMesh'
import type { IncomingCall } from '@/hooks/call/useCallSignaling'
import type { PeerMetadata } from '@/types/webrtc'

export type { PeerConnection, IncomingCall }

export type CallStatus = 'idle' | 'calling' | 'receiving' | 'connecting' | 'connected'
export type CallType = 'dm' | 'group'

export interface CallState {
    callStatus: CallStatus
    callType: CallType | null
    roomId: string | null
    myStream: MediaStream | null
    peers: PeerConnection[]
    incomingCall: IncomingCall | null
    isAudioMuted: boolean
    isVideoMuted: boolean
    isScreenSharing: boolean
    error: string | null
}

export interface CallActions {
    startGroupCall: (groupId: string, userId: string, metadata?: Partial<PeerMetadata>) => Promise<void>
    startDMCall: (targetUserId: string) => Promise<void>
    joinCall: (roomId?: string) => Promise<void>
    endCall: () => Promise<void>
    toggleAudio: () => void
    toggleVideo: () => void
    toggleScreenShare: () => Promise<void>
    switchCamera: () => Promise<void>
    answerCall: () => Promise<void>
    declineCall: () => Promise<void>
}

export type CallContextType = CallState & CallActions

export interface CallRefs {
    isMountedRef: React.MutableRefObject<boolean>
    callStatusRef: React.MutableRefObject<CallStatus>
    roomIdRef: React.MutableRefObject<string | null>
    targetUserIdRef: React.MutableRefObject<string | null>
    isCleaningUpRef: React.MutableRefObject<boolean>
    isRoomReadyRef: React.MutableRefObject<boolean>
    pendingPeersToCreate: React.MutableRefObject<Array<{ peerId: string, metadata?: PeerMetadata }>>
    localStreamRef: React.MutableRefObject<MediaStream | null>
}
