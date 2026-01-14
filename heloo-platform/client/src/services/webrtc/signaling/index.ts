/**
 * SignalingService Module Index
 * 
 * Re-exports the SignalingService and related types.
 * @module services/webrtc/signaling
 */

export { SignalingService } from './SignalingService'
export { createSignalingError } from './createError'
export type {
    IncomingCallPayload,
    CallCancelledPayload,
    IncomingCallCallback,
    CallCancelledCallback,
} from './types'

// Singleton instance
import { SignalingService } from './SignalingService'
export const signalingService = new SignalingService()
