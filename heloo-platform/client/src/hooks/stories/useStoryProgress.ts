/**
 * useStoryProgress Hook
 * Manages story progress timer using requestAnimationFrame for performance
 * 
 * @module hooks/stories/useStoryProgress
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStoryStore } from '@/store/storyStore'
import { markStoryViewed } from '@/services/stories'
import type { Story, StoryGroup } from '@/types'

interface UseStoryProgressProps {
    isOpen: boolean
    isPaused: boolean
    duration: number
    currentStory: Story | null
    currentGroup: StoryGroup | null
    currentStoryIndex: number
    /** When false, progress bar waits for media to load */
    mediaReady: boolean
    /** When true, pause progress (e.g., poll is loading) */
    pollLoading?: boolean
}

interface UseStoryProgressReturn {
    progress: number
}

const isInteractiveTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false

    const tagName = target.tagName
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return !!target.closest('[data-story-interactive="true"]')
}

/**
 * Handles progress bar animation and auto-advance
 * Uses requestAnimationFrame for smooth, battery-efficient updates
 */
export function useStoryProgress({
    isOpen,
    isPaused,
    duration,
    currentStory,
    currentGroup,
    currentStoryIndex,
    mediaReady,
    pollLoading = false
}: UseStoryProgressProps): UseStoryProgressReturn {
    const [progress, setProgress] = useState(0)
    const rafRef = useRef<number | null>(null)
    const startTimeRef = useRef<number | null>(null)
    const pausedTimeRef = useRef<number>(0)
    const hasCompletedRef = useRef(false)
    const mountedRef = useRef(true)
    const markedStoriesRef = useRef<Set<string>>(new Set())
    // Track paused state for animate callback (avoid race with RAF)
    const shouldPauseRef = useRef(false)
    const shouldPause = isPaused || pollLoading
    shouldPauseRef.current = shouldPause
    const interactionLockRef = useRef(false)

    // Track mount state
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // Track immediate interactions (pointer down) to avoid one-frame completion race
    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (isInteractiveTarget(event.target)) {
                interactionLockRef.current = true
            }
        }

        window.addEventListener('pointerdown', handlePointerDown, true)
        return () => window.removeEventListener('pointerdown', handlePointerDown, true)
    }, [])

    // Clear marked cache on close
    useEffect(() => {
        if (!isOpen) markedStoriesRef.current.clear()
    }, [isOpen])

    // Handle story completion
    const handleComplete = useCallback(() => {
        if (hasCompletedRef.current || !mountedRef.current) return
        hasCompletedRef.current = true

        const store = useStoryStore.getState()
        const moved = store.nextStory()
        if (!moved) {
            const movedGroup = store.nextGroup()
            if (!movedGroup) store.closeViewer()
        }
    }, [])

    // Reset progress only on actual story change (not pollLoading toggle)
    const prevStoryIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (currentStory?.id && currentStory.id !== prevStoryIdRef.current) {
            setProgress(0)
            hasCompletedRef.current = false
            startTimeRef.current = null
            pausedTimeRef.current = 0
            prevStoryIdRef.current = currentStory.id
        }
    }, [currentStory?.id])

    // Progress animation using requestAnimationFrame
    useEffect(() => {
        if (!isOpen || !currentStory) return

        // Wait for media to load and not paused/interacting before starting progress
        if (!mediaReady || isPaused || pollLoading) return

        const animate = (timestamp: number) => {
            if (!mountedRef.current) return
            // Check if paused (prevents race condition with RAF callback)
            if (shouldPauseRef.current) return

            // If user is interacting, skip this frame to avoid premature completion
            const isTyping = isInteractiveTarget(document.activeElement)
            if (isTyping) return

            if (interactionLockRef.current) {
                interactionLockRef.current = false
                rafRef.current = requestAnimationFrame(animate)
                return
            }

            // Initialize start time
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp - pausedTimeRef.current
            }

            const elapsed = timestamp - startTimeRef.current
            const newProgress = Math.min((elapsed / duration) * 100, 100)

            setProgress(newProgress)

            if (newProgress >= 100) {
                handleComplete()
            } else {
                rafRef.current = requestAnimationFrame(animate)
            }
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [isOpen, isPaused, pollLoading, mediaReady, currentStory?.id, currentStoryIndex, duration, handleComplete])

    // Handle pause/resume - track elapsed time
    // Also handles pollLoading (e.g., when user is typing in question input)
    useEffect(() => {
        const shouldPause = isPaused || pollLoading

        if (shouldPause && startTimeRef.current) {
            // Store elapsed time when pausing
            pausedTimeRef.current = performance.now() - startTimeRef.current
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        } else if (!shouldPause && pausedTimeRef.current > 0) {
            // Resume from where we left off
            startTimeRef.current = performance.now() - pausedTimeRef.current
        }
    }, [isPaused, pollLoading])

    // Mark story as viewed
    useEffect(() => {
        if (currentStory && currentGroup && isOpen) {
            if (!markedStoriesRef.current.has(currentStory.id)) {
                markedStoriesRef.current.add(currentStory.id)
                useStoryStore.getState().markAsViewed(currentGroup.userId, currentStory.id)
                markStoryViewed(currentStory.id).catch(console.error)
            }
        }
    }, [currentStory, currentGroup, isOpen])

    return { progress }
}
