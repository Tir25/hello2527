/**
 * AcceptedRequestItem Component
 * 
 * Displays "X accepted your follow request" notification
 * Mobile-optimized with larger touch targets and clearer visual hierarchy
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { UserCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import GlassCard from '@/components/ui/GlassCard'
import { formatNotificationTime, isNewNotification } from '@/hooks/activity/notificationUtils'
import { cn } from '@/utils/cn'
import type { Profile } from '@/features/profile/types/profile.types'

interface AcceptedRequestItemProps {
    profile: Profile
    acceptedAt: string
    onViewProfile: () => void
}

const AcceptedRequestItemComponent = ({
    profile,
    acceptedAt,
    onViewProfile,
}: AcceptedRequestItemProps) => {
    const displayName = profile.full_name || profile.username || profile.email?.split('@')[0] || 'User'
    const isNew = isNewNotification(acceptedAt)
    const timeAgo = formatNotificationTime(acceptedAt)

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
        >
            <GlassCard
                className={cn(
                    'p-3 sm:p-4 transition-all active:scale-[0.99] touch-manipulation',
                    isNew && 'bg-gradient-to-r from-green-50/60 to-transparent border-l-4 border-l-green-500'
                )}
                onClick={onViewProfile}
            >
                <div className="flex items-center gap-3">
                    {/* Avatar with badge */}
                    <div className="flex-shrink-0 relative">
                        <Avatar profile={profile} size="md" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-sm ring-2 ring-white">
                            <UserCheck size={10} className="text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] leading-snug">
                            <span className={cn('font-semibold text-gray-800', isNew && 'text-gray-900')}>
                                {displayName}
                            </span>
                            <span className="text-gray-600"> accepted your request</span>
                        </p>
                        <p className={cn(
                            'text-[12px] mt-0.5',
                            isNew ? 'text-green-600 font-medium' : 'text-gray-500'
                        )}>
                            {timeAgo}
                        </p>
                    </div>

                    {/* New indicator */}
                    {isNew && (
                        <div className="flex-shrink-0 pr-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
                        </div>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    )
}

export const AcceptedRequestItem = memo(AcceptedRequestItemComponent)
AcceptedRequestItem.displayName = 'AcceptedRequestItem'
