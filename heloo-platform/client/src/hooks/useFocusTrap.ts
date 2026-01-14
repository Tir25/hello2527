/**
 * useFocusTrap Hook
 * 
 * Traps focus within a specified element for modal dialogs and overlays.
 * Ensures keyboard users can't tab outside the modal while it's open.
 * 
 * @module hooks/useFocusTrap
 */

import { useEffect, useRef, RefObject } from 'react'

// Selector for focusable elements
const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ')

interface UseFocusTrapOptions {
    /** Whether the focus trap is active */
    isActive?: boolean
    /** Element to focus when trap activates (defaults to first focusable) */
    initialFocusRef?: RefObject<HTMLElement | null>
    /** Element to focus when trap deactivates (defaults to previously focused) */
    returnFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Hook to trap focus within a container element.
 * 
 * @param containerRef - Ref to the container element
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null)
 * useFocusTrap(modalRef, { isActive: isModalOpen })
 * ```
 */
export function useFocusTrap(
    containerRef: RefObject<HTMLElement | null>,
    options: UseFocusTrapOptions = {}
) {
    const { isActive = true, initialFocusRef, returnFocusRef } = options
    const previouslyFocusedRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!isActive || !containerRef.current) return

        const container = containerRef.current

        // Store the previously focused element
        previouslyFocusedRef.current = document.activeElement as HTMLElement

        // Get all focusable elements
        const getFocusableElements = (): HTMLElement[] => {
            return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
        }

        // Focus initial element
        const focusableElements = getFocusableElements()
        if (initialFocusRef?.current) {
            initialFocusRef.current.focus()
        } else if (focusableElements.length > 0) {
            // Small delay to ensure DOM is ready
            requestAnimationFrame(() => {
                focusableElements[0]?.focus()
            })
        }

        // Handle tab key to trap focus
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return

            const focusable = getFocusableElements()
            if (focusable.length === 0) return

            const firstElement = focusable[0]
            const lastElement = focusable[focusable.length - 1]
            const activeElement = document.activeElement

            // Shift+Tab on first element -> go to last
            if (event.shiftKey && activeElement === firstElement) {
                event.preventDefault()
                lastElement.focus()
                return
            }

            // Tab on last element -> go to first
            if (!event.shiftKey && activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
                return
            }
        }

        container.addEventListener('keydown', handleKeyDown)

        return () => {
            container.removeEventListener('keydown', handleKeyDown)

            // Restore focus to previously focused element
            if (returnFocusRef?.current) {
                returnFocusRef.current.focus()
            } else if (previouslyFocusedRef.current) {
                previouslyFocusedRef.current.focus()
            }
        }
    }, [isActive, containerRef, initialFocusRef, returnFocusRef])
}

export default useFocusTrap
