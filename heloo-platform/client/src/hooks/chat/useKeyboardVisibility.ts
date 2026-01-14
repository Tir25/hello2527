/**
 * useKeyboardVisibility Hook
 * 
 * Responsibility: Handle mobile keyboard appearance
 * Layer: Custom Hook
 * 
 * Extracted from ChatWindow to improve modularity.
 * Handles:
 * - Detecting when virtual keyboard appears
 * - Scrolling input field into view
 * - Works with visualViewport API for accurate detection
 */

import { useEffect } from 'react'

interface UseKeyboardVisibilityOptions {
    /** CSS selector for the input element to scroll into view */
    inputSelector?: string
    /** Threshold ratio - keyboard considered open if viewport < this % of window height */
    threshold?: number
}

/**
 * Hook to handle mobile keyboard visibility
 * Automatically scrolls the input into view when keyboard appears
 */
export const useKeyboardVisibility = ({
    inputSelector = '.z-chat-input',
    threshold = 0.7,
}: UseKeyboardVisibilityOptions = {}) => {
    useEffect(() => {
        const handleViewportResize = () => {
            if (!window.visualViewport) return

            const viewportHeight = window.visualViewport.height
            const windowHeight = window.innerHeight

            // If viewport is significantly smaller, keyboard is likely showing
            // Threshold: if viewport < threshold% of window height, keyboard is open
            if (viewportHeight < windowHeight * threshold) {
                // Use requestAnimationFrame to ensure DOM has updated
                requestAnimationFrame(() => {
                    const inputElement = document.querySelector(inputSelector)
                    if (inputElement) {
                        inputElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                        })
                    }
                })
            }
        }

        window.visualViewport?.addEventListener('resize', handleViewportResize)

        return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportResize)
        }
    }, [inputSelector, threshold])
}
