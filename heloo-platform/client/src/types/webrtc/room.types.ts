/**
 * WebRTC Room & Participant Types
 * 
 * Types for rooms, participants, and peer metadata.
 * @module types/webrtc/room.types
 */

/**
 * Metadata for a peer in the room
 */
export interface PeerMetadata {
    userId: string
    username?: string
    avatarUrl?: string
    isMuted?: boolean
    isVideoOff?: boolean
    isScreenSharing?: boolean
    deviceType?: 'desktop' | 'mobile' | 'tablet'
    joinedAt?: number
}

/**
 * Information about a participant in the room
 */
export interface RoomParticipant {
    userId: string
    username?: string
    avatarUrl?: string
    joinedAt: number
    presenceRef?: string  // Supabase presence reference
    metadata?: PeerMetadata
}

/**
 * Room information and state
 */
export interface RoomInfo {
    /** Unique room identifier */
    roomId: string
    /** List of current participants */
    participants: RoomParticipant[]
    /** Whether this is a group call */
    isGroupCall: boolean
    /** Group ID if group call */
    groupId?: string
    /** When the room was created/joined */
    createdAt: number
    /** Maximum allowed participants (0 = unlimited) */
    maxParticipants?: number
    /** Room configuration */
    config?: RoomConfig
}

/**
 * Room configuration options
 */
export interface RoomConfig {
    /** Whether to receive own broadcasts (for multi-device) */
    enableSelfBroadcast?: boolean
    /** Auto-reconnect on disconnect */
    autoReconnect?: boolean
    /** Maximum reconnect attempts */
    maxReconnectAttempts?: number
    /** Reconnect delay in ms */
    reconnectDelayMs?: number
}

/**
 * Options for joining a room
 */
export interface JoinRoomOptions {
    /** Peer metadata to share with others */
    metadata?: Partial<PeerMetadata>
    /** Room configuration */
    config?: RoomConfig
    /** Whether this is a group call */
    isGroupCall?: boolean
    /** Group ID if group call */
    groupId?: string
}
