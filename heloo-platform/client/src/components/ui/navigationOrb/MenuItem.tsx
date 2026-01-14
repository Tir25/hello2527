/**
 * MenuItem Component
 * 
 * Dark glass menu item with rich indigo/purple tones.
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { MenuItemProps } from './types'
import { getBubbleItemVariants } from './animations'
import { MENU_ITEM_SIZE } from './constants'

/**
 * Single menu item in the navigation fan.
 */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
    function MenuItem(
        { item, x, y, isOpen, prefersReducedMotion: _prefersReducedMotion, isFocused, onClick },
        ref
    ) {
        const Icon = item.icon
        const variants = getBubbleItemVariants(x, y)

        return (
            <motion.button
                ref={ref}
                onClick={onClick}
                className="pointer-events-auto absolute rounded-full flex items-center justify-center group z-[90] touch-manipulation"
                style={{
                    width: MENU_ITEM_SIZE,
                    height: MENU_ITEM_SIZE,
                }}
                variants={variants}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 1.05, transition: { duration: 0.1 } }}
                role="menuitem"
                aria-label={item.label}
                tabIndex={isOpen ? 0 : -1}
                data-focused={isFocused}
            >
                {/* Dark glass background */}
                <div
                    className="absolute inset-0 rounded-full transition-all duration-200"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30,27,75,0.92) 0%, rgba(17,24,39,0.95) 100%)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: `
              0 6px 25px rgba(0,0,0,0.35),
              0 0 20px rgba(99,102,241,0.15),
              inset 0 1px 1px rgba(255,255,255,0.08)
            `,
                    }}
                />

                {/* Inner glow on hover */}
                <div
                    className="absolute rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                        inset: 4,
                        background: `
              radial-gradient(circle at 35% 30%, rgba(129,140,248,0.35) 0%, transparent 50%),
              radial-gradient(circle at 65% 65%, rgba(167,139,250,0.25) 0%, transparent 50%)
            `,
                    }}
                />

                {/* Top highlight */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        top: 5,
                        left: 7,
                        width: '40%',
                        height: '28%',
                        background: 'radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)',
                        transform: 'rotate(-20deg)',
                    }}
                />

                {/* Icon */}
                <Icon
                    size={22}
                    className="relative z-10 text-white/90 group-hover:text-white transition-colors duration-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                    aria-hidden="true"
                />

                {/* Tooltip */}
                <span
                    className="absolute text-xs font-medium text-white px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap opacity-0 translate-y-2 group-hover:opacity-100 group-hover:-translate-y-10 transition-all duration-200"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30,27,75,0.95) 0%, rgba(17,24,39,0.98) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    }}
                    aria-hidden="true"
                >
                    {item.label}
                </span>
            </motion.button>
        )
    }
)
