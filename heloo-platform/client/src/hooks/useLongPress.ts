import { useRef, useCallback } from 'react'
import { getIsDoubleTapInProgress } from './useDoubleTap'

interface UseLongPressOptions {
    threshold?: number // How long to press before triggering (ms)
    onLongPress: (event: React.MouseEvent | React.TouchEvent) => void
    onPress?: () => void
    onPressStart?: () => void // Called when press starts (for visual feedback)
    onPressCancel?: () => void // Called when press is cancelled
}

interface UseLongPressResult {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onContextMenu: (e: React.MouseEvent) => void
}

/**
 * Hook for detecting long press on mobile and right-click on desktop
 * 
 * Works alongside useDoubleTap - will not trigger if double-tap is in progress.
 * 
 * Usage:
 * ```tsx
 * const longPressHandlers = useLongPress({
 *   threshold: 500,
 *   onLongPress: (e) => handleContextMenu(e),
 * })
 * 
 * return <div {...longPressHandlers}>Content</div>
 * ```
 */
export function useLongPress({
    threshold = 500,
    onLongPress,
    onPress,
    onPressStart,
    onPressCancel,
}: UseLongPressOptions): UseLongPressResult {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isLongPressRef = useRef(false)
    const targetRef = useRef<EventTarget | null>(null)
    const eventPositionRef = useRef<{ x: number; y: number } | null>(null)

    const start = useCallback(
        (event: React.MouseEvent | React.TouchEvent) => {
            // Don't prevent default on touch - causes passive listener issues
            // Just store state for long press detection
            targetRef.current = event.target
            isLongPressRef.current = false

            // Notify that press has started (for visual feedback)
            onPressStart?.()

            // Capture position immediately to avoid stale event coordinates
            const clientX = 'touches' in event && event.touches.length > 0
                ? event.touches[0].clientX
                : 'clientX' in event
                    ? event.clientX
                    : 0
            const clientY = 'touches' in event && event.touches.length > 0
                ? event.touches[0].clientY
                : 'clientY' in event
                    ? event.clientY
                    : 0

            eventPositionRef.current = { x: clientX, y: clientY }

            timerRef.current = setTimeout(() => {
                // Check if double-tap is in progress - if so, don't trigger long press
                if (getIsDoubleTapInProgress()) {
                    isLongPressRef.current = false
                    return
                }

                isLongPressRef.current = true
                // Create a synthetic event with captured coordinates and required methods
                const capturedX = eventPositionRef.current?.x ?? 0
                const capturedY = eventPositionRef.current?.y ?? 0

                const syntheticEvent = {
                    ...event,
                    clientX: capturedX,
                    clientY: capturedY,
                    // Add event methods that may be called by handlers
                    preventDefault: () => { },
                    stopPropagation: () => { },
                    // Create a proper touches array with captured coordinates
                    touches: 'touches' in event ? [{
                        clientX: capturedX,
                        clientY: capturedY,
                    }] : undefined,
                } as React.MouseEvent | React.TouchEvent
                onLongPress(syntheticEvent)
            }, threshold)
        },
        [onLongPress, threshold, onPressStart]
    )

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        // Notify that press was cancelled
        if (!isLongPressRef.current) {
            onPressCancel?.()
        }

        // If it wasn't a long press and we have an onPress handler, call it
        if (!isLongPressRef.current && onPress) {
            onPress()
        }

        isLongPressRef.current = false
    }, [onPress, onPressCancel])

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            onLongPress(e)
        },
        [onLongPress]
    )

    return {
        onMouseDown: start,
        onMouseUp: cancel,
        onMouseLeave: cancel,
        onTouchStart: start,
        onTouchEnd: cancel,
        onContextMenu: handleContextMenu,
    }
}
