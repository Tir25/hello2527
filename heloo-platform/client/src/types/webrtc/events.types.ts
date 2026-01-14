/**
 * WebRTC Event Types
 * 
 * Event callback interfaces for signaling.
 * @module types/webrtc/events.types
 */

import type { SignalPayload } from './signal.types'
import type { SignalingConnectionState, SignalingConnectionInfo } from './connection.types'
import type { PeerMetadata, RoomParticipant } from './room.types'
import type { SignalingError } from './error.types'

/**
 * Callbacks for signaling events
 */
export interface SignalingEvents {
    /** Called when a signal is received from another peer */
    onReceiveSignal: (payload: SignalPayload) => void
    /** Called when a new peer joins the room */
    onPeerJoined?: (peerId: string, metadata?: PeerMetadata) => void
    /** Called when a peer leaves the room */
    onPeerLeft?: (peerId: string) => void
    /** Called when an error occurs */
    onError?: (error: SignalingError) => void
    /** Called when connection state changes */
    onConnectionStateChange?: (state: SignalingConnectionState, info: SignalingConnectionInfo) => void
    /** Called when presence sync completes */
    onPresenceSync?: (participants: RoomParticipant[]) => void
}
