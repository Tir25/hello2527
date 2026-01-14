/**
 * FollowBackItem Component
 * 
 * Displays a follow-back suggestion after accepting a request.
 * Extracted from ActivityPage for reusability and cleaner code.
 */

import { motion } from 'framer-motion'
import { UserCheck, XCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import GlassCard from '@/components/ui/GlassCard'
import type { Profile } from '@/features/profile/types/profile.types'
import type { IncomingRequest } from '@/hooks/activity/useActivityRequests'

interface FollowBackItemProps {
    request: IncomingRequest
    isFollowingBack: boolean
    onFollowBack: () => void
    onDismiss: () => void
    onViewProfile: () => void
    displayName: string
    profile: Profile
}

export const FollowBackItem = ({
    request,
    isFollowingBack,
    onFollowBack,
    onDismiss,
    onViewProfile,
    displayName,
    profile,
}: FollowBackItemProps) => {
    return (
        <motion.div
            key={`followback-${request.requester_id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            <GlassCard className="p-3 sm:p-4 bg-gradient-to-r from-purple-50/50 to-cyan-50/50 border-purple-200/50">
                {/* Mobile: Stack layout, Desktop: Row layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Top row: Avatar + Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={onViewProfile}
                            className="flex-shrink-0 hover:scale-105 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <Avatar profile={profile} size="md" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <button
                                onClick={onViewProfile}
                                className="text-left w-full"
                            >
                                <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">
                                    {displayName}
                                </p>
                                <p className="text-xs sm:text-sm text-purple-600">
                                    Started following you
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Actions - Responsive layout */}
                    <div className="flex items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="primary"
                            onClick={onFollowBack}
                            disabled={isFollowingBack}
                            isLoading={isFollowingBack}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 active:from-violet-800 active:to-purple-700 text-white px-3 sm:px-4 py-3 text-sm min-h-[48px] rounded-xl"
                        >
                            <UserCheck size={16} />
                            <span>Follow Back</span>
                        </Button>
                        <button
                            onClick={onDismiss}
                            className="p-3 min-w-[48px] min-h-[48px] text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors flex items-center justify-center rounded-xl hover:bg-white/30 active:bg-white/50"
                            aria-label="Dismiss"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
}
