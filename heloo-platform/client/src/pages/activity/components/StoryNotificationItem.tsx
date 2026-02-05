/**
 * StoryNotificationItem Component
 * Displays a story notification (question response or mention)
 *
 * @module pages/activity/components/StoryNotificationItem
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, AtSign } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import type { StoryNotification } from '@/hooks/activity/useStoryNotifications'

interface StoryNotificationItemProps {
    notification: StoryNotification
    onTap: (storyId: string) => void
}

/**
 * Renders a story notification item
 */
export const StoryNotificationItem = memo(function StoryNotificationItem({
    notification,
    onTap
}: StoryNotificationItemProps) {
    const isQuestionResponse = notification.type === 'story_question_response'

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h`
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 7) return `${diffDays}d`
        return date.toLocaleDateString()
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <GlassCard
                className={`p-3 sm:p-4 cursor-pointer transition-all hover:bg-white/60 ${!notification.is_read ? 'ring-2 ring-purple-400/50' : ''
                    }`}
                onClick={() => onTap(notification.resource_id)}
            >
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden">
                        {notification.sender?.avatar_url ? (
                            <img
                                src={notification.sender.avatar_url}
                                alt={notification.sender.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-bold">
                                {notification.sender?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                            <span className="font-semibold">
                                {notification.sender?.username || 'Someone'}
                            </span>
                            {' '}
                            {isQuestionResponse
                                ? 'answered your question'
                                : 'mentioned you in their story'
                            }
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatTime(notification.created_at)}
                        </p>
                    </div>

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isQuestionResponse ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                        {isQuestionResponse ? (
                            <MessageCircle className="w-4 h-4 text-purple-600" />
                        ) : (
                            <AtSign className="w-4 h-4 text-blue-600" />
                        )}
                    </div>

                    {/* Story thumbnail */}
                    {notification.preview_image_url && (
                        <div className="w-11 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                                src={notification.preview_image_url}
                                alt="Story"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    )
})
