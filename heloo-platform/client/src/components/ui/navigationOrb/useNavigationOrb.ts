/**
 * useNavigationOrb Hook
 * 
 * Encapsulates all state and logic for the NavigationOrb component,
 * including accessibility features like keyboard navigation and focus management.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MenuItemConfig, UseNavigationOrbReturn } from './types'
import { MENU_ITEMS, MENU_ID, ANIMATION_DELAY_MS } from './constants'

/**
 * Custom hook for NavigationOrb state and logic.
 * 
 * Features:
 * - Open/close state management
 * - Click debouncing to prevent race conditions
 * - Focus management when menu opens
 * - Arrow key navigation (Up/Down/Home/End)
 * - Escape key to close
 */
export function useNavigationOrb(): UseNavigationOrbReturn {
    const navigate = useNavigate()

    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState(0)

    // Refs for focus management
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Focus first item when menu opens
    useEffect(() => {
        if (isOpen && itemRefs.current[0]) {
            // Small delay to ensure elements are rendered
            requestAnimationFrame(() => {
                itemRefs.current[0]?.focus()
                setFocusedIndex(0)
            })
        }
    }, [isOpen])

    // Close on Escape key (global listener)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    /**
     * Toggle the menu open/closed.
     */
    const handleToggle = useCallback(() => {
        setIsOpen((prev) => !prev)
        setFocusedIndex(0)
    }, [])

    /**
     * Handle menu item click with debouncing.
     * Prevents race conditions from rapid clicks.
     */
    const handleItemClick = useCallback(async (item: MenuItemConfig) => {
        // Prevent double clicks during debounce period
        if (isPending) return

        setIsPending(true)

        // Allow animation to play before navigation
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DELAY_MS))

        // Navigate (no try-catch needed - navigate doesn't throw)
        navigate(item.path)

        // Close menu
        setIsOpen(false)
        setIsPending(false)
    }, [isPending, navigate])

    /**
     * Handle keyboard navigation within the menu.
     * Supports: ArrowUp, ArrowDown, Home, End
     */
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        const itemCount = MENU_ITEMS.length

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight': {
                event.preventDefault()
                const nextIndex = (focusedIndex + 1) % itemCount
                setFocusedIndex(nextIndex)
                itemRefs.current[nextIndex]?.focus()
                break
            }

            case 'ArrowUp':
            case 'ArrowLeft': {
                event.preventDefault()
                const prevIndex = (focusedIndex - 1 + itemCount) % itemCount
                setFocusedIndex(prevIndex)
                itemRefs.current[prevIndex]?.focus()
                break
            }

            case 'Home': {
                event.preventDefault()
                setFocusedIndex(0)
                itemRefs.current[0]?.focus()
                break
            }

            case 'End': {
                event.preventDefault()
                const lastIndex = itemCount - 1
                setFocusedIndex(lastIndex)
                itemRefs.current[lastIndex]?.focus()
                break
            }
        }
    }, [focusedIndex])

    return {
        isOpen,
        isPending,
        focusedIndex,
        itemRefs,
        handleToggle,
        handleItemClick,
        handleKeyDown,
        menuId: MENU_ID,
    }
}
