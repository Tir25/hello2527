/**
 * SignalingService Types and Constants
 * 
 * Type definitions and constants for the signaling service.
 * @module services/webrtc/signaling/types
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
    SignalingConnectionState,
    RoomConfig,
    RoomInfo,
    RoomParticipant,
    PeerMetadata,
    SignalingEvents,
} from '@/types/webrtc'

// ============================================
// Constants
// ============================================

export const CHANNEL_PREFIX = 'call:room:'
export const PERSONAL_CHANNEL_PREFIX = 'signaling:'
export const DEFAULT_RECONNECT_DELAY = 1000
export const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5
export const PRESENCE_SYNC_TIMEOUT = 10000

// ============================================
// Incoming Call Types
// ============================================

export interface IncomingCallPayload {
    type: 'incoming_call'
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

export interface CallCancelledPayload {
    type: 'call_cancelled'
    roomId: string
    reason: 'caller_ended' | 'declined' | 'timeout'
    timestamp: number
}

export type IncomingCallCallback = (payload: IncomingCallPayload) => void
export type CallCancelledCallback = (payload: CallCancelledPayload) => void

// ============================================
// Service State Interface
// ============================================

export interface SignalingState {
    channel: RealtimeChannel | null
    currentUserId: string | null
    currentRoomId: string | null
    connectionState: SignalingConnectionState
    connectedAt: number | null
    lastError: Error | null
    reconnectAttempts: number
    reconnectTimeout: ReturnType<typeof setTimeout> | null
    personalChannel: RealtimeChannel | null
    personalUserId: string | null
    onIncomingCallCallback: IncomingCallCallback | null
    onCallCancelledCallback: CallCancelledCallback | null
    isJoining: boolean
    isDestroyed: boolean
    roomInfo: RoomInfo | null
    participants: Map<string, RoomParticipant>
    config: RoomConfig
    peerMetadata: Partial<PeerMetadata>
    // Callbacks
    onSignalCallback: SignalingEvents['onReceiveSignal'] | null
    onPeerJoinedCallback: SignalingEvents['onPeerJoined'] | null
    onPeerLeftCallback: SignalingEvents['onPeerLeft'] | null
    onErrorCallback: SignalingEvents['onError'] | null
    onConnectionStateChangeCallback: SignalingEvents['onConnectionStateChange'] | null
    onPresenceSyncCallback: SignalingEvents['onPresenceSync'] | null
}

export const DEFAULT_CONFIG: RoomConfig = {
    enableSelfBroadcast: false,
    autoReconnect: true,
    maxReconnectAttempts: DEFAULT_MAX_RECONNECT_ATTEMPTS,
    reconnectDelayMs: DEFAULT_RECONNECT_DELAY,
}
