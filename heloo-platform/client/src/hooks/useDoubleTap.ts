/**
 * useDoubleTap Hook
 * 
 * Custom hook to detect double-tap gestures on mobile.
 * Works alongside long-press without interference.
 * 
 * @module hooks/useDoubleTap
 */

import { useRef, useCallback } from 'react'
import { triggerHaptic } from './useIsMobileUI'

interface UseDoubleTapOptions {
    /** Callback when double-tap is detected */
    onDoubleTap: () => void
    /** Maximum time between taps in ms (default: 300) */
    threshold?: number
    /** Whether double-tap is enabled (default: true) */
    enabled?: boolean
    /** Callback to cancel long-press when double-tap starts */
    onDoubleTapStart?: () => void
}

interface DoubleTapHandlers {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
}

// Module-level flag to track if double-tap is in progress
// This is used by useLongPress to check if it should cancel
let isDoubleTapInProgress = false

export const getIsDoubleTapInProgress = () => isDoubleTapInProgress

/**
 * Hook to detect double-tap gesture
 * 
 * @example
 * const doubleTapHandlers = useDoubleTap({
 *   onDoubleTap: () => console.log('Double tapped!'),
 * })
 * 
 * return <div {...doubleTapHandlers}>Tap me twice</div>
 */
export const useDoubleTap = ({
    onDoubleTap,
    threshold = 300,
    enabled = true,
    onDoubleTapStart,
}: UseDoubleTapOptions): DoubleTapHandlers => {
    const lastTapRef = useRef<number>(0)
    const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleTouchStart = useCallback((_e: React.TouchEvent) => {
        if (!enabled) return

        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current

        // If this is the second tap within threshold, mark as double-tap in progress
        if (timeSinceLastTap < threshold && timeSinceLastTap > 0) {
            isDoubleTapInProgress = true
            onDoubleTapStart?.()
        }
    }, [threshold, enabled, onDoubleTapStart])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!enabled) return

        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current

        if (timeSinceLastTap < threshold && timeSinceLastTap > 0) {
            // Double-tap detected
            e.preventDefault()
            e.stopPropagation()

            // Clear any pending timeout
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current)
                tapTimeoutRef.current = null
            }

            // Trigger haptic feedback
            triggerHaptic('light')

            // Execute callback
            onDoubleTap()

            // Reset state
            lastTapRef.current = 0
            isDoubleTapInProgress = false
        } else {
            // First tap - record time
            lastTapRef.current = now
            isDoubleTapInProgress = false

            // Clear after threshold to reset
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current)
            }
            tapTimeoutRef.current = setTimeout(() => {
                lastTapRef.current = 0
            }, threshold)
        }
    }, [onDoubleTap, threshold, enabled])

    return {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
    }
}
