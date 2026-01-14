/**
 * useClickOutside Hook
 * 
 * Handles click outside and escape key events for closing the menu.
 * @module components/chat/MessageContextMenu/useClickOutside
 */

import { useEffect, type RefObject } from 'react'

interface UseClickOutsideOptions {
    menuRef: RefObject<HTMLElement | null>
    onClose: () => void
}

export function useClickOutside({ menuRef, onClose }: UseClickOutsideOptions) {
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement

            // Don't close if clicking on the reaction bar
            if (target.closest('[data-reaction-bar]')) {
                return
            }

            // Don't close if clicking within the menu
            if (menuRef.current && menuRef.current.contains(target)) {
                return
            }

            onClose()
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [menuRef, onClose])
}
