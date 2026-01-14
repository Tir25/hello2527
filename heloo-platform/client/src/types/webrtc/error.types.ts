/**
 * WebRTC Error Types
 * 
 * Error codes and SignalingError class.
 * @module types/webrtc/error.types
 */

/**
 * Signaling-specific error codes
 */
export type SignalingErrorCode =
    | 'CONNECTION_FAILED'       // Failed to connect to signaling server
    | 'ROOM_FULL'               // Room has reached max participants
    | 'ROOM_NOT_FOUND'          // Room does not exist
    | 'UNAUTHORIZED'            // Not authorized to join room
    | 'ALREADY_CONNECTED'       // Already connected to a room
    | 'NOT_CONNECTED'           // Not connected to any room
    | 'SEND_FAILED'             // Failed to send signal
    | 'INVALID_SIGNAL'          // Received invalid signal data
    | 'PRESENCE_ERROR'          // Error with presence tracking
    | 'CHANNEL_ERROR'           // Supabase channel error
    | 'NETWORK_ERROR'           // Network connectivity issue
    | 'UNKNOWN'                 // Unknown error

/**
 * Custom error class for signaling errors
 */
export class SignalingError extends Error {
    code: SignalingErrorCode
    details?: Record<string, unknown>

    constructor(code: SignalingErrorCode, message: string, details?: Record<string, unknown>) {
        super(message)
        this.name = 'SignalingError'
        this.code = code
        this.details = details

        // Maintain proper stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SignalingError)
        }
    }
}
