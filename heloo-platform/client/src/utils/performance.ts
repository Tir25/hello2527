/**
 * Performance Utilities
 * 
 * Provides utilities for detecting device capabilities and optimizing
 * animations/effects for low-end devices.
 */

/**
 * Detects if the device is likely low-end based on various heuristics.
 * Uses device memory, hardware concurrency, and connection type.
 */
export const isLowEndDevice = (): boolean => {
    // Check for reduced motion preference first
    if (typeof window !== 'undefined' && window.matchMedia) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return true
        }
    }

    // Check device memory (available in Chrome/Edge)
    const nav = navigator as any
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) {
        return true
    }

    // Check hardware concurrency (CPU cores)
    if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) {
        return true
    }

    // Check connection type (save-data mode or slow connection)
    if (nav.connection) {
        const connection = nav.connection
        if (connection.saveData) {
            return true
        }
        if (connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
            return true
        }
    }

    return false
}

/**
 * Returns appropriate blur value based on device capability.
 * Low-end devices get reduced or no blur for better performance.
 */
export const getOptimalBlur = (defaultBlur: string = 'blur(16px)'): string => {
    if (isLowEndDevice()) {
        return 'blur(4px)' // Reduced blur for low-end devices
    }
    return defaultBlur
}

/**
 * Returns appropriate backdrop filter classes based on device capability.
 */
export const getBackdropClass = (fullClass: string, reducedClass: string): string => {
    if (isLowEndDevice()) {
        return reducedClass
    }
    return fullClass
}

/**
 * Hook-ready version that can be used in React components.
 * Memoizes the result to avoid recalculating on every render.
 */
let cachedIsLowEnd: boolean | null = null

export const getCachedIsLowEndDevice = (): boolean => {
    if (cachedIsLowEnd === null) {
        cachedIsLowEnd = isLowEndDevice()
    }
    return cachedIsLowEnd
}

/**
 * Reset cache (useful for testing or if device state changes)
 */
export const resetPerformanceCache = (): void => {
    cachedIsLowEnd = null
}
