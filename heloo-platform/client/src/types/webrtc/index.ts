/**
 * WebRTC Types Index
 * 
 * Re-exports all WebRTC-related types from domain-specific files.
 * @module types/webrtc
 */

// Signal types
export type { SignalType, SignalPayload } from './signal.types'

// Connection types
export type { SignalingConnectionState, SignalingConnectionInfo } from './connection.types'

// Room & participant types
export type {
    PeerMetadata,
    RoomParticipant,
    RoomInfo,
    RoomConfig,
    JoinRoomOptions
} from './room.types'

// Event types
export type { SignalingEvents } from './events.types'

// Error types
export { SignalingError } from './error.types'
export type { SignalingErrorCode } from './error.types'

// Provider interface
export type { ISignalingProvider } from './provider.types'

// Utility functions
export {
    generateDMRoomId,
    generateGroupRoomId,
    parseRoomId
} from './utils'
export type { ParsedRoomId } from './utils'
