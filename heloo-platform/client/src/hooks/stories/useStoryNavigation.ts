/**
 * useStoryNavigation Hook
 * Handles tap-based navigation and pause/play for story viewer
 * 
 * Tap Zones:
 * - Left 25%: Previous story
 * - Center 50%: Pause/Play toggle
 * - Right 25%: Next story
 * 
 * @module hooks/stories/useStoryNavigation
 */

import { useCallback } from 'react'
import { useStoryStore } from '@/store/storyStore'

interface UseStoryNavigationReturn {
    /** Handle tap on story viewer - zones: 25% prev, 50% pause/play, 25% next */
    handleTap: (e: React.MouseEvent) => void
}

/**
 * Hook for story navigation via tap zones
 * 
 * @returns Navigation handlers for story viewer
 */
export function useStoryNavigation(): UseStoryNavigationReturn {
    const handleTap = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const xPercent = (e.clientX - rect.left) / rect.width

        const store = useStoryStore.getState()

        if (xPercent < 0.25) {
            // Left 25% - go to previous story
            store.prevStory() || store.prevGroup()
        } else if (xPercent > 0.75) {
            // Right 25% - go to next story
            const moved = store.nextStory()
            if (!moved) {
                const movedGroup = store.nextGroup()
                if (!movedGroup) store.closeViewer()
            }
        } else {
            // Center 50% - toggle pause/play
            store.togglePause()
        }
    }, [])

    return { handleTap }
}
