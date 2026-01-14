/**
 * useIsMobileUI Hook
 * 
 * Responsibility: Detect mobile UI mode
 * Layer: Custom Hook (Shared Utility)
 * 
 * Consolidated from duplicate implementations in:
 * - NewGroupModal.tsx
 * - GroupInfoPanel.tsx
 * 
 * Determines if the UI should render in mobile mode based on:
 * - Screen width (< 640px = mobile)
 * - Touch capability
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the UI should render in mobile mode
 * @returns boolean indicating if mobile UI should be used
 */
export const useIsMobileUI = (): boolean => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
            const isSmallScreen = window.innerWidth < 640
            setIsMobile(isTouchDevice && isSmallScreen)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

/**
 * Haptic feedback helper for mobile interactions
 * Triggers vibration feedback on supported devices
 * 
 * @param style - 'light' (10ms), 'medium' (25ms), 'success' (50ms), 'warning' (100ms)
 */
export const triggerHaptic = (
    style: 'light' | 'medium' | 'success' | 'warning' = 'light'
): void => {
    if ('vibrate' in navigator) {
        const durations: Record<typeof style, number> = {
            light: 10,
            medium: 25,
            success: 50,
            warning: 100,
        }
        navigator.vibrate(durations[style])
    }
}
