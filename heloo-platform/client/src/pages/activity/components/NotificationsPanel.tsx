/**
 * NotificationsPanel Component
 *
 * Displays combined notifications:
 * - People who followed you ("X started following you")
 * - People who accepted your requests ("X accepted your follow request")
 * - Story notifications (question responses, mentions)
 *
 * Mobile-optimized with compact stats and scrollable list
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Bell, Users, UserCheck, MessageCircle } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { useNewFollowers, groupByTime, type TimeSection, useStoryNotifications } from '@/hooks/activity'
import { useAcceptedRequests } from '@/hooks/activity/useAcceptedRequests'
import { NewFollowerItem } from './NewFollowerItem'
import { AcceptedRequestItem } from './AcceptedRequestItem'
import { StoryNotificationItem } from './StoryNotificationItem'
import { TimeSectionHeader } from './TimeSectionHeader'

const SECTION_ORDER: TimeSection[] = ['today', 'thisWeek', 'earlier']

interface NotificationItem {
    id: string
    type: 'follower' | 'accepted' | 'story'
    profile?: any
    notification?: any
    timestamp: string
    created_at: string
}

export const NotificationsPanel = () => {
    const navigate = useNavigate()
    const { followers, loading: followersLoading } = useNewFollowers()
    const { accepted, loading: acceptedLoading } = useAcceptedRequests()
    const { notifications: storyNotifs, loading: storyLoading, markAsRead } = useStoryNotifications()

    const handleViewProfile = (userId: string, username?: string | null) => {
        navigate(`/profile/${username || userId}`)
    }

    const handleStoryTap = async (_storyId: string, notificationId: string) => {
        await markAsRead(notificationId)
        // Could open story viewer here if we have the story data
        // For now, just mark as read
    }

    // Combine and sort all notifications
    const allNotifications = useMemo<NotificationItem[]>(() => {
        const followerItems: NotificationItem[] = followers.map(f => ({
            id: `follower-${f.id}`,
            type: 'follower',
            profile: f.profile,
            timestamp: f.followedAt,
            created_at: f.followedAt,
        }))

        const acceptedItems: NotificationItem[] = accepted.map(a => ({
            id: `accepted-${a.id}`,
            type: 'accepted',
            profile: a.profile,
            timestamp: a.acceptedAt,
            created_at: a.acceptedAt,
        }))

        const storyItems: NotificationItem[] = storyNotifs.map(n => ({
            id: `story-${n.id}`,
            type: 'story',
            notification: n,
            timestamp: n.created_at,
            created_at: n.created_at,
        }))

        return [...followerItems, ...acceptedItems, ...storyItems].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }, [followers, accepted, storyNotifs])

    const groupedNotifications = groupByTime(allNotifications)
    const loading = followersLoading || acceptedLoading || storyLoading
    const totalCount = allNotifications.length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    if (totalCount === 0) {
        return (
            <GlassCard className="p-8 sm:p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-2">
                        <Bell size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">No notifications yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        New followers, accepted requests, and story activity will appear here.
                    </p>
                </div>
            </GlassCard>
        )
    }

    return (
        <div className="space-y-3">
            {/* Compact Stats Row */}
            <div className="flex items-center gap-3 px-1 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-purple-500" />
                    <span className="text-[13px] text-gray-600 font-medium">{followers.length} followers</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5">
                    <UserCheck size={14} className="text-green-500" />
                    <span className="text-[13px] text-gray-600 font-medium">{accepted.length} accepted</span>
                </div>
                {storyNotifs.length > 0 && (
                    <>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <div className="flex items-center gap-1.5">
                            <MessageCircle size={14} className="text-purple-500" />
                            <span className="text-[13px] text-gray-600 font-medium">{storyNotifs.length} story</span>
                        </div>
                    </>
                )}
            </div>

            {/* Time-grouped notifications */}
            {SECTION_ORDER.map(section => {
                const sectionItems = groupedNotifications[section]
                if (sectionItems.length === 0) return null

                return (
                    <div key={section}>
                        <TimeSectionHeader section={section} count={sectionItems.length} />
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-2">
                                {sectionItems.map((item) => {
                                    if (item.type === 'follower') {
                                        return (
                                            <NewFollowerItem
                                                key={item.id}
                                                profile={item.profile}
                                                followedAt={item.timestamp}
                                                onViewProfile={() => handleViewProfile(item.profile.id, item.profile.username)}
                                            />
                                        )
                                    } else if (item.type === 'accepted') {
                                        return (
                                            <AcceptedRequestItem
                                                key={item.id}
                                                profile={item.profile}
                                                acceptedAt={item.timestamp}
                                                onViewProfile={() => handleViewProfile(item.profile.id, item.profile.username)}
                                            />
                                        )
                                    } else if (item.type === 'story' && item.notification) {
                                        return (
                                            <StoryNotificationItem
                                                key={item.id}
                                                notification={item.notification}
                                                onTap={(storyId) => handleStoryTap(storyId, item.notification.id)}
                                            />
                                        )
                                    }
                                    return null
                                })}
                            </div>
                        </AnimatePresence>
                    </div>
                )
            })}
        </div>
    )
}
