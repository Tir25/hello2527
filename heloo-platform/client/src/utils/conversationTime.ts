/**
 * Conversation Time Formatting Utilities
 * 
 * Responsibility: Format timestamps for conversation list display
 * Layer: Utility
 */

/**
 * Formats a message timestamp for display in conversation list.
 * Returns compact format: "Just now", "5m", "2h", "3d", or "Dec 25"
 */
export const formatMessageTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`

    // For older messages, show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Formats last message preview for conversation item.
 * Handles sender prefix ("You: ", "John: ") for better context.
 */
export const formatMessagePreview = (
    message: string | null | undefined,
    isOwnMessage?: boolean,
    senderName?: string
): string => {
    if (!message) return ''

    const truncated = message.length > 50
        ? message.slice(0, 50) + '...'
        : message

    if (isOwnMessage) {
        return `You: ${truncated}`
    }

    if (senderName) {
        return `${senderName}: ${truncated}`
    }

    return truncated
}
