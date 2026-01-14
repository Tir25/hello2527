/**
 * Story Mention Bubble
 * 
 * Renders a story mention preview in chat messages
 * Allows clicking to open the story in the viewer
 * 
 * @module components/chat/message/StoryMentionBubble
 */

import { useState, useCallback } from 'react'
import { toast } from '@/store/toastStore'
import { useStoryStore } from '@/store/storyStore'
import type { StoryMentionPayload } from '@/types/database.types'

interface StoryMentionBubbleProps extends StoryMentionPayload {
    className?: string
}

export function StoryMentionBubble({
    storyId,
    storyOwnerId,
    thumbnailUrl,
    mediaUrl,
    expiresAt,
    className = ''
}: StoryMentionBubbleProps) {
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
            className={`cursor-pointer mb-2 ${className}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <div className="relative w-24 h-36 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
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
                        <span className="text-white text-xs text-center px-2">Story expired</span>
                    </div>
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                )}

                {/* Play icon for non-expired stories */}
                {!isExpired && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                    </div>
                )}
            </div>
            <p className="text-xs mt-1 opacity-80">Mentioned you in their story</p>
        </div>
    )
}
