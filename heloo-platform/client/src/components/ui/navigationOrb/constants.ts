/**
 * NavigationOrb Constants
 * 
 * Centralized configuration for layout, timing, and menu items.
 */

import { MessageCircle, Search, Bell, LayoutDashboard, User } from 'lucide-react'
import type { MenuItemConfig } from './types'

// ============================================================================
// SIZING CONSTANTS
// ============================================================================

/** Main orb diameter in pixels */
export const ORB_SIZE = 72

/** Menu item diameter in pixels */
export const MENU_ITEM_SIZE = 52

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

/** Radius from orb center to menu items */
export const ORB_RADIUS = 110

/** Start angle for fan spread (degrees from top) */
export const START_ANGLE = 200

/** End angle for fan spread (degrees from top) */
export const END_ANGLE = 340

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/** Delay before navigation after item click (ms) */
export const ANIMATION_DELAY_MS = 120

/** Debounce time to prevent rapid clicks (ms) */
export const DEBOUNCE_DELAY_MS = 150

// ============================================================================
// ACCESSIBILITY CONSTANTS
// ============================================================================

/** ID for the menu panel for ARIA controls */
export const MENU_ID = 'navigation-orb-menu'

// ============================================================================
// MENU ITEMS CONFIGURATION
// ============================================================================

/**
 * Menu items for the navigation orb.
 * Order determines position in the fan (left to right).
 */
export const MENU_ITEMS: MenuItemConfig[] = [
    { id: 'chat', icon: MessageCircle, label: 'Chat', path: '/chat' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
    { id: 'activity', icon: Bell, label: 'Activity', path: '/activity' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the x,y position for a menu item in the fan.
 * 
 * @param index - Item index (0-based from left)
 * @param totalItems - Total number of items in the menu
 * @returns Object with x and y coordinates relative to orb center
 */
export function calculateBubblePosition(
    index: number,
    totalItems: number
): { x: number; y: number } {
    const DEG_TO_RAD = Math.PI / 180
    const angleRange = END_ANGLE - START_ANGLE
    const angleStep = totalItems > 1 ? angleRange / (totalItems - 1) : 0
    const angle = START_ANGLE + index * angleStep

    return {
        x: Math.cos(angle * DEG_TO_RAD) * ORB_RADIUS,
        y: Math.sin(angle * DEG_TO_RAD) * ORB_RADIUS,
    }
}
