/**
 * RequestItem Component
 * 
 * Displays a single pending connection request with accept/decline actions.
 * Mobile-optimized with:
 * - 52px minimum touch targets
 * - Stacked layout on mobile, row on desktop
 * - Large, easy-to-tap buttons
 * - Clear visual feedback
 */

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import GlassCard from '@/components/ui/GlassCard'
import { formatNotificationTime, isNewNotification } from '@/hooks/activity/notificationUtils'
import { cn } from '@/utils/cn'
import type { Profile } from '@/features/profile/types/profile.types'
import type { IncomingRequest } from '@/hooks/activity/useActivityRequests'

interface RequestItemProps {
    request: IncomingRequest
    isProcessing: boolean
    onAccept: () => void
    onDecline: () => void
    onViewProfile: () => void
    displayName: string
    profile: Profile
    showTime?: boolean
}

export const RequestItem = ({
    request,
    isProcessing,
    onAccept,
    onDecline,
    onViewProfile,
    displayName,
    profile,
    showTime = false,
}: RequestItemProps) => {
    const isNew = isNewNotification(request.created_at)
    const timeAgo = formatNotificationTime(request.created_at)

    return (
        <motion.div
            key={request.relationship_id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
                opacity: 0,
                scale: 0.98,
                transition: { duration: 0.15 }
            }}
            layout
            transition={{ duration: 0.2 }}
        >
            <GlassCard
                className={cn(
                    'p-3 sm:p-4 transition-colors',
                    isNew && 'bg-gradient-to-r from-cyan-50/60 to-transparent border-l-4 border-l-cyan-500'
                )}
            >
                <div className="flex items-center gap-3">
                    {/* Avatar - Tappable */}
                    <button
                        onClick={onViewProfile}
                        className="flex-shrink-0 active:scale-95 transition-transform touch-manipulation"
                        aria-label={`View ${displayName}'s profile`}
                    >
                        <Avatar profile={profile} size="md" />
                    </button>

                    {/* User Info - Tappable */}
                    <button
                        onClick={onViewProfile}
                        className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity touch-manipulation"
                    >
                        <p className="font-semibold text-gray-800 truncate text-[15px] leading-tight">
                            {displayName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[13px] text-gray-500">
                                Wants to connect
                            </p>
                            {showTime && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className={cn(
                                        'text-[12px]',
                                        isNew ? 'text-cyan-600 font-medium' : 'text-gray-400'
                                    )}>
                                        {timeAgo}
                                    </span>
                                </>
                            )}
                        </div>
                    </button>

                    {/* Actions - Icon buttons on mobile */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={onAccept}
                            disabled={isProcessing}
                            className={cn(
                                'w-11 h-11 rounded-full flex items-center justify-center',
                                'bg-green-500 text-white shadow-md shadow-green-500/30',
                                'active:scale-90 transition-all touch-manipulation',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'hover:bg-green-600'
                            )}
                            aria-label="Accept request"
                        >
                            {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Check size={20} strokeWidth={2.5} />
                            )}
                        </button>
                        <button
                            onClick={onDecline}
                            disabled={isProcessing}
                            className={cn(
                                'w-11 h-11 rounded-full flex items-center justify-center',
                                'bg-gray-100 text-gray-600 border border-gray-200',
                                'active:scale-90 transition-all touch-manipulation',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                            )}
                            aria-label="Decline request"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
}
