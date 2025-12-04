import { useRef, useEffect } from 'react'
import { socketService } from '@/lib/services/socket.service'
import { TYPING_STOP_TIMEOUT, TYPING_THROTTLE_MS } from '@/lib/constants/typing'

/**
 * Typing Indicator Hook
 * 
 * Responsibility: Manages typing indicator state and Socket.IO events
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Throttles typing_start emissions (300ms between events)
 * - Debounces typing_stop (3s after last keystroke)
 * - Cleanup on unmount/receiver change
 * - Handles window/tab close events
 * 
 * @param receiverId - ID of the message receiver
 * @param disabled - Whether typing events should be emitted
 */

export interface UseTypingIndicatorReturn {
    handleTyping: () => void
    cleanupTyping: () => void
}

export const useTypingIndicator = (
    receiverId: string | undefined,
    disabled: boolean = false
): UseTypingIndicatorReturn => {
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hasEmittedTypingStartRef = useRef<boolean>(false)
    const lastTypingEmitRef = useRef<number>(0)
    const receiverIdRef = useRef<string | null>(null)

    // Update receiverId ref when it changes
    useEffect(() => {
        receiverIdRef.current = receiverId || null
    }, [receiverId])

    /**
     * Emits typing_start event with throttling and sets up debounced typing_stop
     */
    const handleTyping = () => {
        if (!receiverId || disabled) return

        const now = Date.now()
        const timeSinceLastEmit = now - lastTypingEmitRef.current

        // Throttle typing_start emissions to prevent network spam
        if (!hasEmittedTypingStartRef.current || timeSinceLastEmit >= TYPING_THROTTLE_MS) {
            socketService.emitTypingStart(receiverId)
            hasEmittedTypingStartRef.current = true
            lastTypingEmitRef.current = now
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set timeout to emit typing_stop after inactivity period
        typingTimeoutRef.current = setTimeout(() => {
            if (hasEmittedTypingStartRef.current && receiverId) {
                socketService.emitTypingStop(receiverId)
                hasEmittedTypingStartRef.current = false
            }
            typingTimeoutRef.current = null
        }, TYPING_STOP_TIMEOUT)
    }

    /**
     * Immediately stops typing indicator and clears timeout
     */
    const cleanupTyping = () => {
        // Clear timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
        }

        // Stop typing indicator
        if (hasEmittedTypingStartRef.current && receiverIdRef.current) {
            socketService.emitTypingStop(receiverIdRef.current)
            hasEmittedTypingStartRef.current = false
        }
    }

    // Cleanup on unmount
    // CRITICAL FIX: Empty dependency array prevents re-running on every render
    useEffect(() => {
        return () => {
            // Access refs at cleanup time to avoid stale closures
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            if (hasEmittedTypingStartRef.current && receiverIdRef.current) {
                socketService.emitTypingStop(receiverIdRef.current)
            }
        }
    }, [])

    // Cleanup when receiverId changes
    useEffect(() => {
        return () => {
            if (hasEmittedTypingStartRef.current && receiverIdRef.current && receiverIdRef.current !== receiverId) {
                socketService.emitTypingStop(receiverIdRef.current)
                hasEmittedTypingStartRef.current = false
            }
        }
    }, [receiverId])

    // Handle window/tab close events to prevent ghost typing
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (hasEmittedTypingStartRef.current && receiverIdRef.current) {
                try {
                    socketService.emitTypingStop(receiverIdRef.current)
                } catch {
                    // Ignore errors during unload - socket may already be disconnected
                }
            }
        }

        const handleVisibilityChange = () => {
            if (document.hidden && hasEmittedTypingStartRef.current && receiverIdRef.current) {
                socketService.emitTypingStop(receiverIdRef.current)
                hasEmittedTypingStartRef.current = false
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    return {
        handleTyping,
        cleanupTyping,
    }
}
