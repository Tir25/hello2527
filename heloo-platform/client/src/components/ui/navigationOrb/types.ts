/**
 * NavigationOrb Types
 * 
 * Type definitions for the NavigationOrb component and its subcomponents.
 */

import type { LucideIcon } from 'lucide-react'

/**
 * Configuration for a single menu item in the navigation orb.
 */
export interface MenuItemConfig {
    /** Unique identifier for the menu item */
    id: string
    /** Lucide icon component to display */
    icon: LucideIcon
    /** Accessible label for the menu item */
    label: string
    /** Path to navigate to when clicked */
    path: string
}

/**
 * Props for the MenuItem component.
 */
export interface MenuItemProps {
    /** Menu item configuration */
    item: MenuItemConfig
    /** Calculated X position from center */
    x: number
    /** Calculated Y position from center */
    y: number
    /** Whether the menu is open */
    isOpen: boolean
    /** Whether reduced motion is preferred */
    prefersReducedMotion: boolean
    /** Index for focus management */
    index: number
    /** Whether this item is currently focused */
    isFocused: boolean
    /** Click handler */
    onClick: () => void
}

/**
 * Props for the OrbButton component.
 */
export interface OrbButtonProps {
    /** Whether the menu is open */
    isOpen: boolean
    /** Toggle handler */
    onToggle: () => void
    /** Whether reduced motion is preferred */
    prefersReducedMotion: boolean
    /** ID of the controlled menu for aria-controls */
    menuId: string
}

/**
 * Props for the MenuPanel component.
 */
export interface MenuPanelProps {
    /** Whether the menu is open */
    isOpen: boolean
    /** Menu items configuration */
    items: MenuItemConfig[]
    /** Whether reduced motion is preferred */
    prefersReducedMotion: boolean
    /** Currently focused item index */
    focusedIndex: number
    /** Refs for menu items for focus management */
    itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
    /** Item click handler */
    onItemClick: (item: MenuItemConfig) => void
    /** Keyboard event handler */
    onKeyDown: (event: React.KeyboardEvent) => void
    /** Unique ID for aria-controls */
    menuId: string
}

/**
 * Props for the Backdrop component.
 */
export interface BackdropProps {
    /** Whether the backdrop is visible */
    isVisible: boolean
    /** Click handler to close */
    onClick: () => void
}

/**
 * Return type for the useNavigationOrb hook.
 */
export interface UseNavigationOrbReturn {
    /** Whether the menu is open */
    isOpen: boolean
    /** Whether a navigation is pending (debounce) */
    isPending: boolean
    /** Currently focused item index */
    focusedIndex: number
    /** Refs for menu items */
    itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
    /** Toggle the menu open/closed */
    handleToggle: () => void
    /** Handle item click with debouncing */
    handleItemClick: (item: MenuItemConfig) => void
    /** Handle keyboard navigation */
    handleKeyDown: (event: React.KeyboardEvent) => void
    /** Unique ID for the menu */
    menuId: string
}
