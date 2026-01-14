/**
 * Pinned Messages Types
 * 
 * Type definitions for pinned messages components.
 * @module components/chat/pins/types
 */

export interface PinnedMessage {
    id: string
    content: string
    sender_id: string
    pinned_at: string
    pinned_by: string
    sender_name?: string
}

export interface PinnedMessageBarProps {
    /** Conversation ID (groupId for groups, otherUserId for DMs) */
    conversationId: string
    /** Current user ID (needed for DM queries) */
    currentUserId?: string
    /** Whether this is a group conversation */
    isGroup?: boolean
    /** Whether current user can unpin */
    canUnpin?: boolean
    /** Callback when user clicks a pinned message */
    onMessageClick?: (messageId: string) => void
    /** Additional CSS classes */
    className?: string
}

export interface UsePinnedMessagesReturn {
    pinnedMessages: PinnedMessage[]
    loading: boolean
    unpinning: string | null
    handleUnpin: (messageId: string) => Promise<void>
}
