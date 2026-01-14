/**
 * WebRTC Provider Interface
 * 
 * Abstract interface for signaling providers.
 * Allows swapping backends (Supabase → AWS/Firebase).
 * 
 * @module types/webrtc/provider.types
 */

import type { SignalPayload, SignalType } from './signal.types'
import type { SignalingConnectionState, SignalingConnectionInfo } from './connection.types'
import type { RoomInfo, RoomParticipant, JoinRoomOptions } from './room.types'
import type { SignalingEvents } from './events.types'

/**
 * Interface for signaling providers
 * 
 * Implementations can be swapped without changing application code:
 * - SupabaseSignalingProvider (current)
 * - AWSSignalingProvider (future)
 * - FirebaseSignalingProvider (future)
 * 
 * @example
 * const provider: ISignalingProvider = new SupabaseSignalingProvider()
 * await provider.joinRoom('room-123', 'user-1', { username: 'John' })
 * provider.onSignal((signal) => handleSignal(signal))
 */
export interface ISignalingProvider {
    // ===== Room Lifecycle =====

    /**
     * Join a signaling room
     * @param roomId - Unique room identifier
     * @param userId - Current user's ID
     * @param options - Optional join options
     * @throws {SignalingError} If already connected or connection fails
     */
    joinRoom(roomId: string, userId: string, options?: JoinRoomOptions): Promise<void>

    /**
     * Leave the current room
     */
    leaveRoom(): Promise<void>

    // ===== Signaling =====

    /**
     * Send a signal to a specific peer or all peers
     * @param payload - Signal payload (timestamp added automatically)
     * @throws {SignalingError} If not connected or send fails
     */
    sendSignal(payload: Omit<SignalPayload, 'timestamp'>): Promise<void>

    /**
     * Send a signal to a specific peer
     */
    sendSignalToPeer(peerId: string, type: SignalType, signalData: SignalPayload['signalData']): Promise<void>

    /**
     * Broadcast a signal to all peers in the room
     */
    broadcastSignal(type: SignalType, signalData: SignalPayload['signalData']): Promise<void>

    // ===== Event Handling =====

    /** Register callback for incoming signals */
    onSignal(callback: SignalingEvents['onReceiveSignal']): void

    /** Register callback for peer join events */
    onPeerJoined(callback: NonNullable<SignalingEvents['onPeerJoined']>): void

    /** Register callback for peer leave events */
    onPeerLeft(callback: NonNullable<SignalingEvents['onPeerLeft']>): void

    /** Register callback for errors */
    onError(callback: NonNullable<SignalingEvents['onError']>): void

    /** Register callback for connection state changes */
    onConnectionStateChange(callback: NonNullable<SignalingEvents['onConnectionStateChange']>): void

    /** Register callback for presence sync */
    onPresenceSync(callback: NonNullable<SignalingEvents['onPresenceSync']>): void

    /** Remove all event listeners */
    removeAllListeners(): void

    // ===== State Queries =====

    /** Get current connection state */
    getConnectionState(): SignalingConnectionState

    /** Get detailed connection info */
    getConnectionInfo(): SignalingConnectionInfo

    /** Get room info (null if not connected) */
    getRoomInfo(): RoomInfo | null

    /** Get list of current participant IDs */
    getCurrentParticipants(): string[]

    /** Get participant info by ID */
    getParticipant(userId: string): RoomParticipant | null

    /** Check if connected to a room */
    isConnected(): boolean
}
