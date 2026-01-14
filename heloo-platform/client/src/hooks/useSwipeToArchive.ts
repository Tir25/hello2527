import { useState, useRef, useCallback, useEffect } from 'react'

interface SwipeState {
    startX: number
    currentX: number
    swiping: boolean
}

interface UseSwipeToArchiveOptions {
    threshold?: number // Minimum distance to trigger archive (default: 100px)
    onArchive: () => void | Promise<void>
    enabled?: boolean
}

interface UseSwipeToArchiveReturn {
    swipeOffset: number
    isSwiping: boolean
    isArchiving: boolean
    swipeProgress: number // 0-1 indicating how far towards threshold
    handlers: {
        onTouchStart: (e: React.TouchEvent) => void
        onTouchMove: (e: React.TouchEvent) => void
        onTouchEnd: () => void
        onMouseDown: (e: React.MouseEvent) => void
        onMouseMove: (e: React.MouseEvent) => void
        onMouseUp: () => void
        onMouseLeave: () => void
    }
}

/**
 * Custom hook for swipe-to-archive gesture on conversation items.
 * 
 * Features:
 * - Left swipe reveals archive action
 * - Threshold-based triggering
 * - Haptic feedback (if available)
 * - Loading state during archive operation
 * - Works with both touch and mouse events
 */
export const useSwipeToArchive = ({
    threshold = 100,
    onArchive,
    enabled = true,
}: UseSwipeToArchiveOptions): UseSwipeToArchiveReturn => {
    const [swipeState, setSwipeState] = useState<SwipeState>({
        startX: 0,
        currentX: 0,
        swiping: false,
    })
    const [isArchiving, setIsArchiving] = useState(false)
    const startTimeRef = useRef<number>(0)

    // Calculate swipe offset (negative for left swipe)
    const swipeOffset = swipeState.swiping
        ? Math.min(0, swipeState.currentX - swipeState.startX)
        : 0

    const swipeProgress = Math.min(1, Math.abs(swipeOffset) / threshold)

    // Reset swipe state
    const resetSwipe = useCallback(() => {
        setSwipeState({ startX: 0, currentX: 0, swiping: false })
    }, [])

    // Handle archive action
    const handleArchive = useCallback(async () => {
        if (isArchiving) return

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50)
        }

        setIsArchiving(true)
        try {
            await onArchive()
        } finally {
            setIsArchiving(false)
            resetSwipe()
        }
    }, [onArchive, isArchiving, resetSwipe])

    // Touch handlers
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (!enabled || isArchiving) return
        const touch = e.touches[0]
        startTimeRef.current = Date.now()
        setSwipeState({
            startX: touch.clientX,
            currentX: touch.clientX,
            swiping: true,
        })
    }, [enabled, isArchiving])

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!swipeState.swiping || !enabled) return
        const touch = e.touches[0]
        setSwipeState((prev) => ({
            ...prev,
            currentX: touch.clientX,
        }))
    }, [swipeState.swiping, enabled])

    const onTouchEnd = useCallback(() => {
        if (!swipeState.swiping || !enabled) return

        const offset = swipeState.currentX - swipeState.startX
        const duration = Date.now() - startTimeRef.current

        // Check if swipe meets threshold or is a fast flick
        if (offset < -threshold || (offset < -50 && duration < 200)) {
            handleArchive()
        } else {
            resetSwipe()
        }
    }, [swipeState, threshold, enabled, handleArchive, resetSwipe])

    // Mouse handlers (for desktop testing)
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!enabled || isArchiving) return
        startTimeRef.current = Date.now()
        setSwipeState({
            startX: e.clientX,
            currentX: e.clientX,
            swiping: true,
        })
    }, [enabled, isArchiving])

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!swipeState.swiping || !enabled) return
        setSwipeState((prev) => ({
            ...prev,
            currentX: e.clientX,
        }))
    }, [swipeState.swiping, enabled])

    const onMouseUp = useCallback(() => {
        if (!swipeState.swiping || !enabled) return

        const offset = swipeState.currentX - swipeState.startX

        if (offset < -threshold) {
            handleArchive()
        } else {
            resetSwipe()
        }
    }, [swipeState, threshold, enabled, handleArchive, resetSwipe])

    const onMouseLeave = useCallback(() => {
        if (swipeState.swiping) {
            resetSwipe()
        }
    }, [swipeState.swiping, resetSwipe])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            resetSwipe()
        }
    }, [resetSwipe])

    return {
        swipeOffset,
        isSwiping: swipeState.swiping,
        isArchiving,
        swipeProgress,
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd,
            onMouseDown,
            onMouseMove,
            onMouseUp,
            onMouseLeave,
        },
    }
}
