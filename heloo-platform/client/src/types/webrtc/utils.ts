/**
 * WebRTC Utility Functions
 * 
 * Helper functions for room ID generation and parsing.
 * @module types/webrtc/utils
 */

/**
 * Generate a unique room ID for DM calls
 * Creates consistent room ID regardless of caller/callee order
 */
export function generateDMRoomId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort()
    return `dm:${sorted[0]}:${sorted[1]}`
}

/**
 * Generate a room ID for group calls
 */
export function generateGroupRoomId(groupId: string): string {
    return `group:${groupId}`
}

/**
 * Parsed room ID result
 */
export interface ParsedRoomId {
    type: 'dm' | 'group'
    id: string
    participants?: string[]
}

/**
 * Parse a room ID to determine call type
 */
export function parseRoomId(roomId: string): ParsedRoomId {
    if (roomId.startsWith('dm:')) {
        const parts = roomId.slice(3).split(':')
        return { type: 'dm', id: roomId, participants: parts }
    }
    if (roomId.startsWith('group:')) {
        return { type: 'group', id: roomId.slice(6) }
    }
    // Legacy or custom room IDs
    return { type: 'group', id: roomId }
}
