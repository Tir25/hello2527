/**
 * UserAvatar Component
 * Displays user avatar with initials + gradient fallback
 * Use this when you only have username/avatarUrl strings (not a full Profile)
 * 
 * @module components/ui/UserAvatar
 */

import { memo, useState, useMemo } from 'react'
import { cn } from '@/utils/cn'

interface UserAvatarProps {
    username: string
    avatarUrl: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg'
    className?: string
}

const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
}

// Generate consistent gradient based on username
const gradients = [
    'from-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
]

function getGradient(name: string): string {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
}

function getInitials(name: string): string {
    return name
        .split(/[\s._-]+/)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
}

/**
 * Lightweight avatar with initials fallback
 * More ergonomic than Avatar when you don't have a full Profile object
 */
export const UserAvatar = memo(function UserAvatar({
    username,
    avatarUrl,
    size = 'md',
    className,
}: UserAvatarProps) {
    const [imgError, setImgError] = useState(false)
    const showImage = avatarUrl && !imgError

    const initials = useMemo(() => getInitials(username), [username])
    const gradient = useMemo(() => getGradient(username), [username])

    return (
        <div
            className={cn(
                sizeClasses[size],
                'rounded-full overflow-hidden flex-shrink-0',
                'flex items-center justify-center',
                !showImage && `bg-gradient-to-br ${gradient}`,
                'text-white font-semibold',
                className
            )}
        >
            {showImage ? (
                <img
                    src={avatarUrl}
                    alt={username}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="select-none">{initials}</span>
            )}
        </div>
    )
})
