/**
 * UserInfo Component
 * 
 * Displays user/group information in the chat header.
 * @module components/features/ChatHeader/UserInfo
 */

import { memo } from 'react'
import { Users } from 'lucide-react'

interface UserInfoProps {
    name: string
    subtitle?: string
    isGroup: boolean
    memberCount?: number
    onClick?: () => void
}

export const UserInfo = memo(function UserInfo({
    name,
    subtitle,
    isGroup,
    memberCount,
    onClick,
}: UserInfoProps) {
    const content = (
        <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 truncate">
                {name}
            </h2>
            {isGroup && memberCount !== undefined ? (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={12} />
                    <span>{memberCount} members</span>
                </div>
            ) : subtitle ? (
                <p className="text-xs text-gray-500 truncate">
                    {subtitle}
                </p>
            ) : null}
        </div>
    )

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
            >
                {content}
            </button>
        )
    }

    return content
})
