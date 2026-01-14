/**
 * ChatHeader Types
 * 
 * Type definitions for the chat header component.
 * @module components/features/ChatHeader/types
 */

/**
 * Minimal user/conversation profile for ChatHeader
 * Intentionally flexible to work with different profile types
 */
export interface ChatHeaderUser {
    id: string
    full_name?: string | null
    username?: string | null
    email?: string | null
    avatar_url?: string | null
}

export interface ChatHeaderProps {
    /** Selected user/conversation profile */
    selectedUser: ChatHeaderUser
    /** Callback when back button is clicked */
    onBack: () => void
    /** Whether to show back button (mobile) */
    showBackButton?: boolean
    /** Whether this is a group chat */
    isGroup?: boolean
    /** Whether the user is currently online (DM only) */
    isOnline?: boolean
    /** Group name (if group chat) */
    groupName?: string
    /** Group avatar URL (if group chat) */
    groupAvatar?: string
    /** Number of members in group */
    memberCount?: number
    /** Callback when group info is clicked */
    onGroupInfoClick?: () => void
    /** Callback when gallery is clicked (DM only) */
    onGalleryClick?: () => void
    /** Callback for video call */
    onVideoCall?: () => void
    /** Callback for voice call */
    onVoiceCall?: () => void
    /** Whether calls are enabled (requires connection) */
    callsEnabled?: boolean
}
