/**
 * WebRTC Connection Types
 * 
 * Types for connection states and info.
 * @module types/webrtc/connection.types
 */

/**
 * Connection state of the signaling service
 */
export type SignalingConnectionState =
    | 'disconnected'  // Not connected to any room
    | 'connecting'    // Attempting to connect
    | 'connected'     // Successfully connected and ready
    | 'reconnecting'  // Lost connection, attempting to reconnect
    | 'error'         // Connection failed

/**
 * Detailed connection info for debugging
 */
export interface SignalingConnectionInfo {
    state: SignalingConnectionState
    roomId: string | null
    userId: string | null
    connectedAt: number | null
    lastError: Error | null
    reconnectAttempts: number
}
