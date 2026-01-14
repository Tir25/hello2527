/**
 * Message Context Menu Types
 * 
 * Type definitions for the message context menu component.
 * @module components/chat/MessageContextMenu/types
 */

import type { DatabaseMessage } from '@/types'

export interface MessageContextMenuProps {
    message: DatabaseMessage
    isOwn: boolean
    position: { x: number; y: number }
    onClose: () => void
    onEdit: () => void
    /** Whether this is a group message */
    isGroup?: boolean
    /** Whether current user is a group admin */
    isGroupAdmin?: boolean
    /** Callback when a reaction is selected */
    onReact?: (emoji: string) => void
}

export interface MenuItemProps {
    onClick: () => void
    disabled?: boolean
    icon: React.ReactNode
    label: string
    colorClass?: string
    hoverClass?: string
}

export interface MenuPosition {
    x: number
    y: number
}
