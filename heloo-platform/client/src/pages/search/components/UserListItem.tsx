/**
 * User List Item Component
 * 
 * Responsibility: Display a single user in search results
 * Layer: UI Component (Presentational)
 * 
 * Features:
 * - Avatar with profile info
 * - Bio/status preview (truncated)
 * - Relationship-based action buttons
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, MessageSquare, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/lib/services/profile.service'
import type { SearchProfile } from '../types'

interface UserListItemProps {
    profile: Profile
    onViewProfile: () => void
    onMessage: () => void
    index: number
}

/**
 * Get display name for user
 */
const getDisplayName = (profile: Profile): string => {
    return profile.full_name || profile.username || profile.email?.split('@')[0] || 'User'
}

/**
 * Truncate bio/status to a reasonable length
 */
const truncateBio = (text: string | null | undefined, maxLength = 50): string | null => {
    if (!text) return null
    const trimmed = text.trim()
    if (trimmed.length <= maxLength) return trimmed
    return trimmed.slice(0, maxLength).trim() + '...'
}

/**
 * Get relationship status from profile
 */
const getRelationshipFlags = (profile: Profile) => {
    const p = profile as SearchProfile
    return {
        isPendingOutgoing: p.isPendingOutgoing ?? false,
        isPendingIncoming: p.isPendingIncoming ?? false,
        amIFollowing: p.amIFollowing ?? false,
        isFollowingMe: p.isFollowingMe ?? false,
    }
}

/**
 * Action Button Component
 */
const ActionButton = memo(({
    profile,
    onViewProfile,
    onMessage
}: {
    profile: Profile
    onViewProfile: () => void
    onMessage: () => void
}) => {
    const displayName = getDisplayName(profile)
    const { isPendingOutgoing, isPendingIncoming, amIFollowing, isFollowingMe } = getRelationshipFlags(profile)

    const baseClass = "min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium rounded-xl touch-manipulation"

    // Already following - show Chat button
    if (amIFollowing) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onMessage() }}
                className={`${baseClass} bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md active:scale-95 transition-all`}
                aria-label={`Message ${displayName}`}
            >
                <MessageSquare size={14} className="inline mr-1" />
                Chat
            </button>
        )
    }

    // Outgoing request pending
    if (isPendingOutgoing) {
        return (
            <span className={`${baseClass} bg-gray-100 text-gray-500 cursor-default`}>
                Requested
            </span>
        )
    }

    // Incoming request pending - show Accept
    if (isPendingIncoming) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onViewProfile() }}
                className={`${baseClass} bg-green-500 text-white shadow-md active:scale-95 transition-all`}
                aria-label={`Accept request from ${displayName}`}
            >
                <UserPlus size={14} className="inline mr-1" />
                Accept
            </button>
        )
    }

    // They follow me but I don't follow them - show Follow Back
    if (isFollowingMe && !amIFollowing) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onViewProfile() }}
                className={`${baseClass} bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md active:scale-95 transition-all`}
                aria-label={`Follow back ${displayName}`}
            >
                <UserPlus size={14} className="inline mr-1" />
                Follow
            </button>
        )
    }

    // Default - show View button
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onViewProfile() }}
            className={`${baseClass} bg-white/80 text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all`}
            aria-label={`View ${displayName}'s profile`}
        >
            View
        </button>
    )
})

ActionButton.displayName = 'ActionButton'

/**
 * User List Item Component
 */
export const UserListItem = memo(({
    profile,
    onViewProfile,
    onMessage,
    index
}: UserListItemProps) => {
    const displayName = getDisplayName(profile)
    const bioPreview = truncateBio(profile.status)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-white/70 to-gray-50/50 backdrop-blur-sm border border-white/40 hover:from-white/90 hover:to-gray-50/70 hover:border-purple-100/50 active:scale-[0.98] transition-all shadow-sm"
        >
            {/* Clickable profile section */}
            <button
                onClick={onViewProfile}
                className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg"
                aria-label={`View ${displayName}'s profile`}
            >
                <Avatar profile={profile} size="md" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-[15px] truncate leading-tight">
                        {displayName}
                    </h3>
                    {profile.username && (
                        <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                    )}
                    {/* Bio preview - show if available */}
                    {bioPreview && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                            {bioPreview}
                        </p>
                    )}
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>

            {/* Action button */}
            <div className="flex-shrink-0">
                <ActionButton
                    profile={profile}
                    onViewProfile={onViewProfile}
                    onMessage={onMessage}
                />
            </div>
        </motion.div>
    )
})

UserListItem.displayName = 'UserListItem'

