/**
 * Story Header
 * User info and controls for story viewer
 * 
 * @module components/stories/StoryHeader
 */

import { memo } from 'react'
import { X, MoreHorizontal } from 'lucide-react'

interface StoryHeaderProps {
    username: string
    avatarUrl: string | null
    timestamp: string
    isOwnStory: boolean
    onClose: () => void
    onMoreClick: () => void
}

/**
 * Format relative time for story
 */
function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`

    return `${Math.floor(diffHours / 24)}d`
}

/**
 * Story header with user info and controls
 */
export const StoryHeader = memo(function StoryHeader({
    username,
    avatarUrl,
    timestamp,
    isOwnStory,
    onClose,
    onMoreClick
}: StoryHeaderProps) {
    return (
        <div
            className="absolute left-0 right-0 px-4 pt-2 flex items-center justify-between z-30"
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        >
            <div className="flex items-center gap-3 bg-black/40 rounded-full pl-1 pr-3 py-1">
                <img
                    src={avatarUrl || '/default-avatar.svg'}
                    className="w-9 h-9 rounded-full object-cover bg-slate-700 ring-2 ring-white/80"
                    alt=""
                />
                <span className="text-white font-semibold text-sm drop-shadow-md">
                    {isOwnStory ? 'You' : username}
                </span>
                <span className="text-white/60 text-xs">
                    {formatTime(timestamp)}
                </span>
            </div>
            <div className="flex gap-1 items-center">
                {isOwnStory && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onMoreClick()
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="text-white w-6 h-6 drop-shadow-md" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Close"
                >
                    <X className="text-white w-7 h-7 drop-shadow-md" />
                </button>
            </div>
        </div>
    )
})
