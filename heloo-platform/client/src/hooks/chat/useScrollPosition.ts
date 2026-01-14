/**
 * useScrollPosition Hook
 * 
 * Tracks scroll position in a container and determines
 * when to show scroll-to-bottom button.
 * 
 * Features:
 * - Detects when user scrolls up
 * - Tracks distance from bottom
 * - Debounced for performance
 * 
 * Responsibility: Scroll state management
 * Layer: Hook
 */

import { useState, useCallback, useEffect, RefObject } from 'react'

interface UseScrollPositionOptions {
    /** Container ref to track */
    containerRef: RefObject<HTMLElement | null>
    /** Distance from bottom (in px) to consider "at bottom" */
    threshold?: number
}

interface UseScrollPositionReturn {
    /** Whether user is scrolled away from bottom */
    isScrolledUp: boolean
    /** Scroll to bottom of container */
    scrollToBottom: () => void
}

export const useScrollPosition = ({
    containerRef,
    threshold = 150,
}: UseScrollPositionOptions): UseScrollPositionReturn => {
    const [isScrolledUp, setIsScrolledUp] = useState(false)

    // Check if scrolled away from bottom
    const checkScrollPosition = useCallback(() => {
        const container = containerRef.current
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight

        setIsScrolledUp(distanceFromBottom > threshold)
    }, [containerRef, threshold])

    // Listen to scroll events
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Use passive listener for performance
        container.addEventListener('scroll', checkScrollPosition, { passive: true })

        // Initial check
        checkScrollPosition()

        return () => {
            container.removeEventListener('scroll', checkScrollPosition)
        }
    }, [containerRef, checkScrollPosition])

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        const container = containerRef.current
        if (!container) return

        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
        })
    }, [containerRef])

    return {
        isScrolledUp,
        scrollToBottom,
    }
}
