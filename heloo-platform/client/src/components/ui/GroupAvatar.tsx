/**
 * GroupAvatar Component
 * 
 * Displays a stylized group avatar with:
 * - Gradient background with Users icon (default)
 * - Optional custom group image
 * - Member count badge
 * - Subtle ring indicator to distinguish from DM avatars
 */

import { Users } from 'lucide-react'
import { cn } from '@/utils/cn'

interface GroupAvatarProps {
    name: string
    avatarUrl?: string | null
    memberCount?: number
    size?: 'sm' | 'md' | 'lg'
    showBadge?: boolean
    className?: string
}

const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
}

const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
}

const badgeSizes = {
    sm: 'text-[9px] px-1',
    md: 'text-[10px] px-1.5',
    lg: 'text-xs px-2',
}

export const GroupAvatar = ({
    name,
    avatarUrl,
    memberCount,
    size = 'md',
    showBadge = true,
    className,
}: GroupAvatarProps) => {
    return (
        <div className={cn('relative', className)}>
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={name}
                    className={cn(
                        'rounded-full object-cover',
                        'ring-2 ring-purple-200',
                        sizeClasses[size]
                    )}
                />
            ) : (
                <div
                    className={cn(
                        'rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500',
                        'flex items-center justify-center',
                        'ring-2 ring-purple-200',
                        'shadow-sm',
                        sizeClasses[size]
                    )}
                >
                    <Users className={cn('text-white', iconSizes[size])} />
                </div>
            )}

            {/* Member count badge */}
            {showBadge && memberCount !== undefined && memberCount > 0 && (
                <span
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5',
                        'bg-purple-600 text-white',
                        'rounded-full font-semibold',
                        'flex items-center justify-center',
                        'min-w-[18px] h-[18px]',
                        'ring-2 ring-white',
                        badgeSizes[size]
                    )}
                >
                    {memberCount > 99 ? '99+' : memberCount}
                </span>
            )}
        </div>
    )
}
