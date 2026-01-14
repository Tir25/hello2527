/**
 * Debounce Utility for Stories Realtime
 * Custom debounce to avoid external dependency
 * 
 * @module hooks/stories/realtime/useDebounce
 */

import { useRef, useCallback } from 'react'

/**
 * Custom debounce hook that doesn't require external packages
 * Returns a debounced version of the callback
 * 
 * @param callback - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
    callback: T,
    delayMs: number
): T {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const callbackRef = useRef(callback)

    // Keep callback ref updated
    callbackRef.current = callback

    const debouncedFn = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args)
            timeoutRef.current = null
        }, delayMs)
    }, [delayMs]) as T

    return debouncedFn
}

/**
 * Clear debounce timeout utility
 */
export function clearDebounceTimeout(
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
): void {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
    }
}
