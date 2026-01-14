/**
 * ReactionBar Component
 * 
 * Displays reactions below a message bubble.
 * 
 * Features:
 * - Shows aggregated reaction counts
 * - Click to toggle own reaction
 * - Highlights user's own reactions
 * - Animated feedback on interaction
 * 
 * @module components/chat/reactions/ReactionBar
 */

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { ReactionSummary } from '@/hooks/chat/reactions'

interface ReactionBarProps {
    reactions: ReactionSummary[]
    onToggle: (emoji: string) => void
    isLoading?: boolean
    className?: string
}

const ReactionBarComponent = ({
    reactions,
    onToggle,
    isLoading = false,
    className,
}: ReactionBarProps) => {
    const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null)

    const handleToggle = useCallback((emoji: string) => {
        if (isLoading) return
        setAnimatingEmoji(emoji)
        onToggle(emoji)
        // Reset animation state after animation completes
        setTimeout(() => setAnimatingEmoji(null), 200)
    }, [isLoading, onToggle])

    if (reactions.length === 0) return null

    return (
        <div className={cn("flex flex-wrap gap-1 mt-1.5", className)}>
            {reactions.map(reaction => (
                <motion.button
                    key={reaction.emoji}
                    onClick={() => handleToggle(reaction.emoji)}
                    disabled={isLoading}
                    animate={animatingEmoji === reaction.emoji ? {
                        scale: [1, 1.2, 1],
                        transition: { duration: 0.2 }
                    } : {}}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm",
                        "transition-all disabled:opacity-50",
                        reaction.hasReacted
                            ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
                            : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                    title={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted`}
                    aria-label={`${reaction.emoji} ${reaction.count} reactions${reaction.hasReacted ? ', you reacted' : ''}`}
                >
                    <span>{reaction.emoji}</span>
                    <span className="text-xs font-medium">{reaction.count}</span>
                </motion.button>
            ))}
        </div>
    )
}

export const ReactionBar = memo(ReactionBarComponent)
ReactionBar.displayName = 'ReactionBar'
