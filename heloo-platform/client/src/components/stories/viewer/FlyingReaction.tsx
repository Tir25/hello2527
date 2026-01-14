/**
 * Flying Reaction Component
 * Animated emoji that flies up
 * 
 * @module components/stories/viewer/FlyingReaction
 */

import { memo } from 'react'
import { motion } from 'framer-motion'

interface FlyingReactionProps {
    emoji: string
    onComplete: () => void
}

/**
 * Emoji that animates upward and fades
 */
export const FlyingReaction = memo(function FlyingReaction({
    emoji,
    onComplete
}: FlyingReactionProps) {
    return (
        <motion.div
            initial={{ y: 0, opacity: 1, scale: 0.5, x: 0 }}
            animate={{
                y: -400,
                opacity: 0,
                scale: 1.5,
                x: (Math.random() - 0.5) * 100
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            onAnimationComplete={onComplete}
            className="absolute bottom-20 right-8 text-4xl pointer-events-none z-50"
        >
            {emoji}
        </motion.div>
    )
})
