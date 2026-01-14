/**
 * useReducedMotion Hook
 * Detects user's prefers-reduced-motion preference for accessibility
 * 
 * @module hooks/useReducedMotion
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * @returns true if user has enabled reduced motion in OS settings
 */
export function useReducedMotion(): boolean {
    const [prefersReduced, setPrefersReduced] = useState(false)

    useEffect(() => {
        // Check if window is available (SSR safety)
        if (typeof window === 'undefined') return

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReduced(mediaQuery.matches)

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReduced(event.matches)
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    return prefersReduced
}
