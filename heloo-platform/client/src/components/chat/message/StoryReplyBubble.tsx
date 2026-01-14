/**
 * Story Reply Bubble
 * 
 * Renders a story reply preview in chat messages
 * Shows thumbnail with reply text
 * 
 * @module components/chat/message/StoryReplyBubble
 */

import { useState, useCallback } from 'react'
import { toast } from '@/store/toastStore'
import { useStoryStore } from '@/store/storyStore'
import type { StoryReplyPayload } from '@/types/database.types'

interface StoryReplyBubbleProps extends StoryReplyPayload {
    className?: string
}

export function StoryReplyBubble({
    storyId,
    storyOwnerId,
    thumbnailUrl,
    mediaUrl,
    expiresAt,
    replyText,
    className = ''
}: StoryReplyBubbleProps) {
    const openStoryById = useStoryStore(s => s.openStoryById)
    const refreshAndOpenStory = useStoryStore(s => s.refreshAndOpenStory)
    const [loading, setLoading] = useState(false)

    const isExpired = new Date(expiresAt) < new Date()
    const imageUrl = thumbnailUrl || mediaUrl

    const handleClick = useCallback(async () => {
        if (isExpired) {
            toast.error('This story has expired')
            return
        }

        // Try to open from current store
        if (openStoryById(storyId, storyOwnerId)) {
            return
        }

        // Story not in store - refresh and retry
        setLoading(true)
        try {
            const success = await refreshAndOpenStory(storyId, storyOwnerId)
            if (!success) {
                toast.error('Story no longer available')
            }
        } finally {
            setLoading(false)
        }
    }, [storyId, storyOwnerId, isExpired, openStoryById, refreshAndOpenStory])

    return (
        <div
            onClick={handleClick}
            className={`cursor-pointer mb-2 flex gap-2 ${className}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            {/* Thumbnail */}
            <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                )}

                {/* Expired overlay */}
                {isExpired && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-[10px] text-center">Expired</span>
                    </div>
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                )}
            </div>

            {/* Reply content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs opacity-70 mb-1">Replied to your story</p>
                <p className="text-sm line-clamp-3">{replyText}</p>
            </div>
        </div>
    )
}
