/**
 * Chat Utility Functions
 *
 * Shared helpers for chat functionality.
 *
 * @module utils/chat
 */

/**
 * Generates a stable, deterministic room ID for a DM conversation.
 * 
 * The room ID is created by sorting the two user IDs alphabetically
 * and joining them with a separator. This ensures both users
 * generate the same room ID regardless of who is sender/receiver.
 * 
 * @param userId1 - First user's ID
 * @param userId2 - Second user's ID
 * @returns A stable room ID like "dm:uuid1_uuid2"
 * 
 * @example
 * getDMRoomId('b5425c6f-...', '53bad179-...') // "dm:53bad179-..._b5425c6f-..."
 * getDMRoomId('53bad179-...', 'b5425c6f-...') // "dm:53bad179-..._b5425c6f-..." (same!)
 */
export const getDMRoomId = (userId1: string, userId2: string): string => {
    const sorted = [userId1, userId2].sort()
    return `dm:${sorted[0]}_${sorted[1]}`
}

/**
 * Gets the conversation room ID for a message.
 * Works for both group messages and DMs.
 * 
 * @param groupId - The group ID (if group message)
 * @param senderId - The sender's user ID
 * @param receiverId - The receiver's user ID (for DMs)
 * @returns The room ID string, or undefined if not determinable
 */
export const getConversationRoomId = (
    groupId: string | null | undefined,
    senderId: string,
    receiverId: string | null | undefined
): string | undefined => {
    // Group message: use group_id
    if (groupId) {
        return groupId
    }

    // DM message: generate stable room ID from the two parties
    if (receiverId) {
        // For DMs, we need both user IDs to create a stable room
        // The message has sender_id and receiver_id which covers both cases
        return getDMRoomId(senderId, receiverId)
    }

    // Fallback for sender's own message before receiver is set
    // This shouldn't normally happen for persisted messages
    return undefined
}
