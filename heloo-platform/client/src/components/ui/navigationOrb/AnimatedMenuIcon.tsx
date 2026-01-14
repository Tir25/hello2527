/**
 * AnimatedMenuIcon Component
 * 
 * Smooth morphing animation between hamburger (☰) and close (×) states.
 * Uses SVG path animation for fluid transitions.
 */

import { motion } from 'framer-motion'

interface AnimatedMenuIconProps {
    isOpen: boolean
    size?: number
    className?: string
}

// Spring transition - 'as const' for proper TypeScript type inference
const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
}

/**
 * Animated hamburger/close icon with smooth morphing.
 */
export const AnimatedMenuIcon: React.FC<AnimatedMenuIconProps> = ({
    isOpen,
    size = 28,
    className = '',
}) => {
    const strokeWidth = 2.5
    const lineColor = 'currentColor'

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            initial={false}
        >
            {/* Top line → transforms to \ part of X */}
            <motion.path
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ d: 'M 4 8 L 24 8' }}
                animate={{
                    d: isOpen ? 'M 6 6 L 22 22' : 'M 4 8 L 24 8',
                }}
                transition={springTransition}
            />

            {/* Middle line → fades out */}
            <motion.path
                d="M 4 14 L 24 14"
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ opacity: 1, x: 0 }}
                animate={{
                    opacity: isOpen ? 0 : 1,
                    x: isOpen ? 10 : 0,
                }}
                transition={springTransition}
            />

            {/* Bottom line → transforms to / part of X */}
            <motion.path
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ d: 'M 4 20 L 24 20' }}
                animate={{
                    d: isOpen ? 'M 6 22 L 22 6' : 'M 4 20 L 24 20',
                }}
                transition={springTransition}
            />
        </motion.svg>
    )
}
