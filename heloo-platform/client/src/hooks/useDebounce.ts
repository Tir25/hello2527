/**
 * useDebounce Hook
 * 
 * Debounces a value with configurable delay.
 * Useful for search inputs to reduce API calls.
 * 
 * Responsibility: Value debouncing
 * Layer: Hook (Utility)
 */

import { useState, useEffect } from 'react'

/**
 * Returns a debounced value that only updates after the specified delay.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 300)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}
