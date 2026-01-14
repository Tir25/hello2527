/**
 * Story Progress Bar
 * Progress indicators for story viewing
 * 
 * @module components/stories/StoryProgressBar
 */

import { memo } from 'react'

interface StoryProgressBarProps {
    totalStories: number
    currentIndex: number
    progress: number
}

/**
 * Progress bar segments for story viewing
 */
export const StoryProgressBar = memo(function StoryProgressBar({
    totalStories,
    currentIndex,
    progress
}: StoryProgressBarProps) {
    return (
        <div className="absolute top-0 left-0 right-0 p-3 flex gap-1.5 z-20">
            {Array.from({ length: totalStories }).map((_, i) => (
                <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-100"
                        style={{
                            width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                        }}
                    />
                </div>
            ))}
        </div>
    )
})
