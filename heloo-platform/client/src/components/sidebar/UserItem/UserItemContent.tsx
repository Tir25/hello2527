/**
 * UserItemContent Component
 * 
 * Displays the avatar, name, message preview, and unread badge.
 * Extracted from UserItem for modularity.
 * 
 * Responsibility: Visual presentation of conversation item
 * Layer: UI Component (Presenter)
 */

import { memo } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { GroupAvatar } from '@/components/ui/GroupAvatar'
import { cn } from '@/utils/cn'
import { formatMessageTime } from '@/utils/conversationTime'
import type { Profile } from '@/lib/services/profile.service'

interface UserItemContentProps {
    user: Profile
    displayName: string
    subtitle: string
    lastMessageTime?: string | null
    unreadCount: number
    isOnline: boolean
    isGroup: boolean
    memberCount?: number
}

const UserItemContentComponent = ({
    user,
    displayName,
    subtitle,
    lastMessageTime,
    unreadCount,
    isOnline,
    isGroup,
    memberCount,
}: UserItemContentProps) => {
    const hasUnread = unreadCount > 0
    const timeDisplay = formatMessageTime(lastMessageTime)

    return (
        <>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {isGroup ? (
                    <GroupAvatar
                        name={displayName}
                        avatarUrl={user.avatar_url}
                        memberCount={memberCount}
                        size="md"
                        showBadge={true}
                    />
                ) : (
                    <Avatar profile={user} size="md" isOnline={isOnline} />
                )}
                <span className="sr-only">
                    Status: {user.status ? user.status : 'No status message set'}
                    {isGroup ? ` (Group with ${memberCount || 0} members)` : isOnline ? ' (Online)' : ' (Offline)'}
                </span>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
                {/* Name and time row */}
                <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                        'text-sm font-semibold text-gray-800 truncate',
                        hasUnread && 'text-gray-900'
                    )}>
                        {displayName}
                    </p>
                    {timeDisplay && (
                        <span className={cn(
                            'text-[11px] flex-shrink-0',
                            hasUnread ? 'text-purple-600 font-medium' : 'text-gray-500'
                        )}>
                            {timeDisplay}
                        </span>
                    )}
                </div>

                {/* Message preview and unread badge row */}
                <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                        'text-[13px] sm:text-xs truncate leading-relaxed',
                        hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
                    )}>
                        {subtitle}
                    </p>
                    {hasUnread && (
                        <span
                            className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full 
                                      bg-gradient-to-r from-purple-500 to-cyan-500 
                                      text-white text-[10px] font-bold 
                                      flex items-center justify-center"
                            aria-label={`${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </>
    )
}

export const UserItemContent = memo(UserItemContentComponent)
UserItemContent.displayName = 'UserItemContent'
