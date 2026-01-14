/**
 * useKeyboardVisibility Hook
 * 
 * Detects when the virtual keyboard is open on mobile devices.
 * Uses the Visual Viewport API for accurate detection.
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the virtual keyboard is visible.
 * Returns true when keyboard is open (viewport height shrinks).
 */
export function useKeyboardVisibility(): boolean {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return

        const visualViewport = window.visualViewport

        // Fallback for browsers without Visual Viewport API
        if (!visualViewport) {
            // Use focus/blur on inputs as fallback
            const handleFocus = (e: FocusEvent) => {
                const target = e.target as HTMLElement
                if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable
                ) {
                    setIsKeyboardVisible(true)
                }
            }

            const handleBlur = () => {
                setIsKeyboardVisible(false)
            }

            document.addEventListener('focusin', handleFocus)
            document.addEventListener('focusout', handleBlur)

            return () => {
                document.removeEventListener('focusin', handleFocus)
                document.removeEventListener('focusout', handleBlur)
            }
        }

        // Store initial viewport height
        const initialHeight = visualViewport.height

        const handleResize = () => {
            // If viewport height decreased significantly (>150px), keyboard is likely open
            const heightDiff = initialHeight - visualViewport.height
            setIsKeyboardVisible(heightDiff > 150)
        }

        visualViewport.addEventListener('resize', handleResize)

        return () => {
            visualViewport.removeEventListener('resize', handleResize)
        }
    }, [])

    return isKeyboardVisible
}
