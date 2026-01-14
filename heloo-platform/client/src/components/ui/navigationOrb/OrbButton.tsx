/**
 * OrbButton Component
 * 
 * Dark glassmorphic orb with rich colors for visibility on any background.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { OrbButtonProps } from './types'
import { getOrbVariants } from './animations'
import { ORB_SIZE } from './constants'
import { AnimatedMenuIcon } from './AnimatedMenuIcon'

/**
 * Main orb trigger button with dark glass effect.
 */
export const OrbButton: React.FC<OrbButtonProps> = ({
    isOpen,
    onToggle,
    prefersReducedMotion,
    menuId,
}) => {
    const orbVariants = useMemo(
        () => getOrbVariants(prefersReducedMotion),
        [prefersReducedMotion]
    )

    return (
        <div
            className="relative group cursor-pointer pointer-events-auto"
            onClick={onToggle}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onToggle()
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
        >
            {/* Outer glow - subtle but visible */}
            {!prefersReducedMotion && (
                <motion.div
                    className="absolute rounded-full will-change-transform"
                    style={{
                        inset: -12,
                        background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.25) 50%, transparent 70%)',
                        filter: 'blur(12px)',
                    }}
                    animate={{
                        scale: isOpen ? [1.1, 1.15, 1.1] : [1, 1.05, 1],
                        opacity: isOpen ? 0.9 : 0.7,
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Drop shadow for depth */}
            <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full bg-black/25 blur-md"
                aria-hidden="true"
            />

            {/* Main glass orb */}
            <motion.div
                variants={orbVariants}
                initial="breathing"
                animate={isOpen ? 'active' : 'breathing'}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95, transition: { duration: 0.1 } }}
                className="relative rounded-full flex items-center justify-center z-[80] overflow-hidden will-change-transform"
                style={{
                    width: ORB_SIZE,
                    height: ORB_SIZE,
                }}
            >
                {/* Dark glass background */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30,27,75,0.95) 0%, rgba(17,24,39,0.98) 50%, rgba(30,27,75,0.95) 100%)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1.5px solid rgba(255,255,255,0.12)',
                        boxShadow: `
              0 10px 40px rgba(0,0,0,0.4),
              0 0 30px rgba(99,102,241,0.2),
              inset 0 1px 2px rgba(255,255,255,0.1),
              inset 0 -2px 6px rgba(0,0,0,0.3)
            `,
                    }}
                />

                {/* Inner colored gradient */}
                <div
                    className="absolute rounded-full"
                    style={{
                        inset: 6,
                        background: `
              radial-gradient(circle at 30% 25%, rgba(129,140,248,0.5) 0%, transparent 45%),
              radial-gradient(circle at 70% 70%, rgba(167,139,250,0.4) 0%, transparent 45%),
              radial-gradient(circle at 50% 50%, rgba(99,102,241,0.3) 0%, rgba(79,70,229,0.2) 60%, transparent 100%)
            `,
                        boxShadow: 'inset 0 0 25px rgba(99,102,241,0.25)',
                    }}
                />

                {/* Top highlight for 3D effect */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        top: 8,
                        left: 10,
                        width: '45%',
                        height: '35%',
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
                        transform: 'rotate(-25deg)',
                    }}
                    aria-hidden="true"
                />

                {/* Subtle rim light */}
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
                    }}
                    aria-hidden="true"
                />

                {/* Icon */}
                <div className="relative z-20">
                    <AnimatedMenuIcon
                        isOpen={isOpen}
                        size={26}
                        className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    />
                </div>
            </motion.div>
        </div>
    )
}
