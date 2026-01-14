/**
 * MessageBubble Types
 * 
 * Type definitions for message bubble components.
 * @module components/chat/message/types
 */

import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'

export interface MessageBubbleProps {
    message: DatabaseMessage
    isOwn: boolean
    recipientProfile?: Profile | null
    isLastMessage?: boolean
    currentUserId?: string
    isGroup?: boolean
    isGroupAdmin?: boolean
    senderProfile?: Profile | null
    showSenderInfo?: boolean
}

export interface BubbleContentProps {
    message: DatabaseMessage
    isOwn: boolean
    isEditing: boolean
    editContent: string
    isEditLoading: boolean
    hasTextContent: boolean
    shouldShowFooter: boolean
    isEdited: boolean
    recipientProfile?: Profile | null
    isLastMessage?: boolean
    currentUserId?: string
    onEditContentChange: (content: string) => void
    onSaveEdit: () => void
    onCancelEdit: () => void
    onEditKeyDown: (e: React.KeyboardEvent) => void
    onImageClick: (url: string) => void
}
