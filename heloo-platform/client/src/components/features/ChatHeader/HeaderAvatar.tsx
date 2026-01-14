/**
 * HeaderAvatar Component
 * 
 * Displays user/group avatar in the chat header.
 * @module components/features/ChatHeader/HeaderAvatar
 */

import { memo } from 'react'
import { Users } from 'lucide-react'

interface HeaderAvatarProps {
    avatarUrl?: string | null
    name: string
    isGroup: boolean
    /** Whether the user is currently online (socket-based) */
    isOnline?: boolean
    onClick?: () => void
}

export const HeaderAvatar = memo(function HeaderAvatar({
    avatarUrl,
    name,
    isGroup,
    isOnline = false,
    onClick,
}: HeaderAvatarProps) {
    const avatar = (
        <div className="relative">
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                />
            ) : isGroup ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20">
                    <Users size={20} className="text-white" />
                </div>
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20">
                    <span className="text-white text-sm font-semibold">
                        {name.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}
            {/* Online indicator for DMs - only show if user is actually online */}
            {!isGroup && isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
            )}
        </div>
    )

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="hover:opacity-80 transition-opacity"
            >
                {avatar}
            </button>
        )
    }

    return avatar
})
