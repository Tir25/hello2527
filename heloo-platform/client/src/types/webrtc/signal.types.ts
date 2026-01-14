/**
 * WebRTC Signal Types
 * 
 * Types for WebRTC signaling messages and payloads.
 * @module types/webrtc/signal.types
 */

/**
 * Types of WebRTC signaling messages
 */
export type SignalType =
    | 'offer'           // SDP offer for connection initiation
    | 'answer'          // SDP answer in response to offer
    | 'ice-candidate'   // ICE candidate for NAT traversal
    | 'new-peer'        // Notification that a new peer joined
    | 'peer-left'       // Notification that a peer left
    | 'renegotiate'     // Request to renegotiate connection (e.g., track changes)
    | 'mute-state'      // Audio/video mute state change
    | 'screen-share'    // Screen sharing state change

/**
 * Payload structure for signaling messages
 * 
 * @example
 * const payload: SignalPayload = {
 *   type: 'offer',
 *   senderId: 'user-1',
 *   targetId: 'user-2',
 *   roomId: 'room-123',
 *   signalData: sdpOffer,
 *   timestamp: Date.now(),
 * }
 */
export interface SignalPayload {
    /** Type of signal being sent */
    type: SignalType
    /** User ID of the sender */
    senderId: string
    /** Target recipient user ID, or 'all' for broadcast */
    targetId: string
    /** Unique room identifier */
    roomId: string
    /** WebRTC signal data (SDP or ICE candidate) */
    signalData: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, unknown> | null
    /** Unix timestamp when signal was created */
    timestamp: number
    /** Whether this is a group call */
    isGroup?: boolean
    /** Group ID if this is a group call */
    groupId?: string
    /** Additional metadata */
    metadata?: Record<string, unknown>
}
