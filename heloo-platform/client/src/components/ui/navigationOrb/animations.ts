/**
 * NavigationOrb Animations
 * 
 * Framer Motion animation variants for the NavigationOrb component.
 * Extracted for performance and to respect reduced motion preferences.
 */

import type { Variants } from 'framer-motion'

// ============================================================================
// ORB BUTTON VARIANTS
// ============================================================================

/**
 * Animation variants for the main orb button.
 * 
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 * @returns Framer Motion variants object
 */
export function getOrbVariants(prefersReducedMotion: boolean): Variants {
    if (prefersReducedMotion) {
        return {
            breathing: { scale: 1 },
            active: { scale: 0.95, transition: { duration: 0.1 } },
        }
    }

    return {
        breathing: {
            scale: [1, 1.03, 1],
            transition: {
                duration: 4.5,
                repeat: Infinity,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
        active: {
            scale: 0.95,
            transition: { duration: 0.2 },
        },
    }
}

// ============================================================================
// MENU CONTAINER VARIANTS
// ============================================================================

/**
 * Animation variants for the menu items container.
 * Controls the staggered appearance of menu items.
 * 
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 * @returns Framer Motion variants object
 */
export function getBubbleContainerVariants(prefersReducedMotion: boolean): Variants {
    if (prefersReducedMotion) {
        return {
            open: { transition: { staggerChildren: 0 } },
            closed: { transition: { staggerChildren: 0 } },
        }
    }

    return {
        open: {
            transition: { staggerChildren: 0.05, delayChildren: 0.05 },
        },
        closed: {
            transition: { staggerChildren: 0.03, staggerDirection: -1 },
        },
    }
}

// ============================================================================
// MENU ITEM VARIANTS
// ============================================================================

/**
 * Animation variants for individual menu items.
 * 
 * @param x - X position when open
 * @param y - Y position when open
 * @returns Framer Motion variants object
 */
export function getBubbleItemVariants(x: number, y: number): Variants {
    return {
        open: {
            x,
            y,
            scale: 1,
            opacity: 1,
            transition: { type: 'spring', stiffness: 350, damping: 22 },
        },
        closed: {
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
            transition: { type: 'spring', stiffness: 450, damping: 28 },
        },
    }
}

// ============================================================================
// ICON ROTATION VARIANTS
// ============================================================================

/**
 * Animation for the orb icon rotation (Menu <-> X).
 * 
 * @param isOpen - Whether the menu is open
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 * @returns Animation props for motion.div
 */
export function getIconAnimation(isOpen: boolean, prefersReducedMotion: boolean) {
    if (prefersReducedMotion) {
        return {}
    }

    return {
        rotate: isOpen ? 180 : 0,
    }
}

/**
 * Transition for icon rotation.
 * 
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 * @returns Transition object or undefined
 */
export function getIconTransition(prefersReducedMotion: boolean) {
    if (prefersReducedMotion) {
        return undefined
    }

    return { type: 'spring', stiffness: 200, damping: 15 } as const
}
