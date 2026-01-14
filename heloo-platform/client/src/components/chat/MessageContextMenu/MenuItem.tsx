/**
 * MenuItem Component
 * 
 * Reusable menu item for the context menu.
 * @module components/chat/MessageContextMenu/MenuItem
 */

import { memo } from 'react'
import type { MenuItemProps } from './types'

export const MenuItem = memo(function MenuItem({
    onClick,
    disabled = false,
    icon,
    label,
    colorClass = 'text-gray-700 dark:text-gray-200',
    hoverClass = 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
}: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm ${colorClass} ${hoverClass} transition-colors disabled:opacity-50`}
            role="menuitem"
        >
            {icon}
            <span>{label}</span>
        </button>
    )
})
