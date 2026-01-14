/**
 * useMenuPosition Hook
 * 
 * Calculates menu position to keep it within viewport bounds.
 * @module components/chat/MessageContextMenu/useMenuPosition
 */

import type { MenuPosition } from './types'

const MENU_WIDTH = 180
const MENU_HEIGHT = 200
const PADDING = 10

/**
 * Calculate menu position to stay within viewport
 */
export function calculateMenuPosition(position: MenuPosition): MenuPosition {
    let x = position.x
    let y = position.y

    // Adjust for right edge
    if (x + MENU_WIDTH + PADDING > window.innerWidth) {
        x = window.innerWidth - MENU_WIDTH - PADDING
    }

    // Adjust for bottom edge
    if (y + MENU_HEIGHT + PADDING > window.innerHeight) {
        y = window.innerHeight - MENU_HEIGHT - PADDING
    }

    // Ensure not off-screen left/top
    x = Math.max(PADDING, x)
    y = Math.max(PADDING, y)

    return { x, y }
}
