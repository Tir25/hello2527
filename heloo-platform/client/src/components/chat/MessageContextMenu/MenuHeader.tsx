/**
 * MenuHeader Component
 * 
 * Header section of the context menu with close button.
 * @module components/chat/MessageContextMenu/MenuHeader
 */

import { memo } from 'react'
import { X } from 'lucide-react'

interface MenuHeaderProps {
    onClose: () => void
}

export const MenuHeader = memo(function MenuHeader({ onClose }: MenuHeaderProps) {
    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Actions
            </span>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Close menu"
            >
                <X size={14} className="text-gray-500" />
            </button>
        </div>
    )
})
