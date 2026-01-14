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
 * - Supports both DM (receiverId) and group (groupId) typing
 * 
 * @param options - Either { receiverId } for DM or { groupId } for group
 * @param disabled - Whether typing events should be emitted
 */

export interface UseTypingIndicatorReturn {
    handleTyping: () => void
    cleanupTyping: () => void
}

export interface TypingOptions {
    receiverId?: string
    groupId?: string
}

export const useTypingIndicator = (
    options: TypingOptions,
    disabled: boolean = false
): UseTypingIndicatorReturn => {
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hasEmittedTypingStartRef = useRef<boolean>(false)
    const lastTypingEmitRef = useRef<number>(0)
    const optionsRef = useRef<TypingOptions | null>(null)

    const targetId = options.receiverId || options.groupId

    // Update options ref when they change
    useEffect(() => {
        optionsRef.current = options
    }, [options.receiverId, options.groupId])

    /**
     * Emits typing_start event with throttling and sets up debounced typing_stop
     */
    const handleTyping = () => {
        if (!targetId || disabled) return

        const now = Date.now()
        const timeSinceLastEmit = now - lastTypingEmitRef.current

        // Throttle typing_start emissions to prevent network spam
        if (!hasEmittedTypingStartRef.current || timeSinceLastEmit >= TYPING_THROTTLE_MS) {
            socketService.emitTypingStart(options)
            hasEmittedTypingStartRef.current = true
            lastTypingEmitRef.current = now
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set timeout to emit typing_stop after inactivity period
        typingTimeoutRef.current = setTimeout(() => {
            if (hasEmittedTypingStartRef.current && optionsRef.current) {
                socketService.emitTypingStop(optionsRef.current)
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
        if (hasEmittedTypingStartRef.current && optionsRef.current) {
            socketService.emitTypingStop(optionsRef.current)
            hasEmittedTypingStartRef.current = false
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            if (hasEmittedTypingStartRef.current && optionsRef.current) {
                socketService.emitTypingStop(optionsRef.current)
            }
        }
    }, [])

    // Cleanup when target changes
    useEffect(() => {
        return () => {
            if (hasEmittedTypingStartRef.current && optionsRef.current) {
                socketService.emitTypingStop(optionsRef.current)
                hasEmittedTypingStartRef.current = false
            }
        }
    }, [options.receiverId, options.groupId])

    // Handle window/tab close events to prevent ghost typing
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (hasEmittedTypingStartRef.current && optionsRef.current) {
                try {
                    socketService.emitTypingStop(optionsRef.current)
                } catch {
                    // Ignore errors during unload
                }
            }
        }

        const handleVisibilityChange = () => {
            if (document.hidden && hasEmittedTypingStartRef.current && optionsRef.current) {
                socketService.emitTypingStop(optionsRef.current)
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
