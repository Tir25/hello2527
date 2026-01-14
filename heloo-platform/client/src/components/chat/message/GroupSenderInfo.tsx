/**
 * Group Sender Info
 * 
 * Responsibility: Display sender avatar and name for group messages
 * Layer: UI Component (Presenter)
 * 
 * Extracted from MessageBubble.tsx for modularity.
 */

import type { Profile } from '@/lib/services/profile.service'

interface GroupSenderAvatarProps {
    senderProfile: Profile
    showSenderInfo: boolean
}

/**
 * Sender avatar for group messages (shown beside message bubble)
 */
export const GroupSenderAvatar = ({ senderProfile, showSenderInfo }: GroupSenderAvatarProps) => {
    if (!showSenderInfo) {
        // Spacer for alignment when not showing avatar
        return <div className="w-7 mr-2 flex-shrink-0" />
    }

    return (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
            {senderProfile.avatar_url ? (
                <img
                    src={senderProfile.avatar_url}
                    alt={senderProfile.full_name || senderProfile.username || 'User'}
                    className="w-7 h-7 rounded-full object-cover"
                />
            ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 
                              flex items-center justify-center text-white text-xs font-semibold">
                    {(senderProfile.full_name || senderProfile.username || '?')[0].toUpperCase()}
                </div>
            )}
        </div>
    )
}

interface GroupSenderNameProps {
    senderProfile: Profile
}

/**
 * Sender name label for group messages (shown above message bubble)
 */
export const GroupSenderName = ({ senderProfile }: GroupSenderNameProps) => {
    return (
        <span className="text-xs text-gray-500 ml-1 mb-1 font-medium">
            {senderProfile.full_name || senderProfile.username || 'Unknown'}
        </span>
    )
}
