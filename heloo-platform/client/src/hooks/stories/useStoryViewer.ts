/**
 * useStoryViewer Hook
 * Manage story viewer state and navigation
 * 
 * @module hooks/stories/useStoryViewer
 */

import { useEffect, useCallback, useRef } from 'react'
import { useStoryStore } from '@/store/storyStore'

/** Default story duration in ms */
const DEFAULT_DURATION_MS = 5000

/**
 * Hook to manage story viewer state
 */
export function useStoryViewer() {
    const {
        groups,
        viewer,
        openViewer,
        closeViewer,
        nextStory,
        prevStory,
        togglePause,
        toggleMute,
    } = useStoryStore()

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Current group and story
    const currentGroup = groups[viewer.currentGroupIndex]
    const currentStory = currentGroup?.stories[viewer.currentStoryIndex]

    // Story duration in ms
    const duration = currentStory
        ? (currentStory.duration_seconds || 5) * 1000
        : DEFAULT_DURATION_MS

    // Clear timer (used for cleanup)
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    // NOTE: Timer logic handled by StoryViewer component's inline progress bar
    // Do not add timer here - it would cause double-advance

    // Cleanup on unmount
    useEffect(() => {
        return clearTimer
    }, [clearTimer])

    // Handle tap navigation
    const handleTap = useCallback((side: 'left' | 'right') => {
        if (side === 'left') {
            prevStory()
        } else {
            nextStory()
        }
    }, [prevStory, nextStory])

    // Handle long press (pause/resume)
    // Note: Pause state is synced with StoryViewer's timer
    const handleLongPress = useCallback((active: boolean) => {
        if (active && !viewer.isPaused) {
            togglePause()
        } else if (!active && viewer.isPaused) {
            togglePause()
        }
    }, [togglePause, viewer.isPaused])

    // Keyboard navigation
    useEffect(() => {
        if (!viewer.isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle keyboard shortcuts when user is typing in an input/textarea
            const target = e.target as HTMLElement
            const isTyping = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable

            if (isTyping) {
                // Only allow Escape to close viewer when typing
                if (e.key === 'Escape') {
                    // Blur the input first, don't close viewer
                    target.blur()
                }
                return
            }

            switch (e.key) {
                case 'ArrowLeft':
                    prevStory()
                    break
                case 'ArrowRight':
                case ' ':
                    nextStory()
                    break
                case 'Escape':
                    closeViewer()
                    break
                case 'm':
                    toggleMute()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [viewer.isOpen, prevStory, nextStory, closeViewer, toggleMute])

    return {
        // State
        isOpen: viewer.isOpen,
        isPaused: viewer.isPaused,
        isMuted: viewer.isMuted,
        currentGroup,
        currentStory,
        currentGroupIndex: viewer.currentGroupIndex,
        currentStoryIndex: viewer.currentStoryIndex,
        totalGroups: groups.length,
        totalStories: currentGroup?.stories.length || 0,
        duration,

        // Actions
        open: openViewer,
        close: closeViewer,
        next: nextStory,
        prev: prevStory,
        togglePause,
        toggleMute,
        handleTap,
        handleLongPress,
    }
}
