/**
 * useHapticFeedback Hook
 * 
 * Provides tactile feedback on supported mobile devices.
 * Falls back gracefully on unsupported devices.
 */

import { useCallback } from 'react'

/**
 * Haptic feedback intensity levels.
 */
type HapticIntensity = 'light' | 'medium' | 'heavy'

/**
 * Hook providing haptic feedback functions for mobile interactions.
 */
export function useHapticFeedback() {
    /**
     * Trigger haptic vibration.
     * 
     * @param intensity - Vibration intensity (light=10ms, medium=25ms, heavy=50ms)
     */
    const vibrate = useCallback((intensity: HapticIntensity = 'light') => {
        // Check for Vibration API support
        if (typeof navigator === 'undefined' || !navigator.vibrate) {
            return
        }

        const durations: Record<HapticIntensity, number> = {
            light: 10,
            medium: 25,
            heavy: 50,
        }

        try {
            navigator.vibrate(durations[intensity])
        } catch {
            // Silently fail if vibration not allowed
        }
    }, [])

    /**
     * Light tap feedback - for menu item selection.
     */
    const tapFeedback = useCallback(() => {
        vibrate('light')
    }, [vibrate])

    /**
     * Medium impact feedback - for menu toggle.
     */
    const impactFeedback = useCallback(() => {
        vibrate('medium')
    }, [vibrate])

    return {
        vibrate,
        tapFeedback,
        impactFeedback,
    }
}
