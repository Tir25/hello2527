/**
 * Quick Reactions Component
 * Emoji reaction buttons with animation
 * 
 * @module components/stories/viewer/QuickReactions
 */

import { memo, useState, useCallback } from 'react'
import { REACTIONS } from '@/constants/storyConstants'
import { FlyingReaction } from './FlyingReaction'

interface QuickReactionsProps {
    onReact: (emoji: string) => void
}

interface FlyingEmoji {
    id: number
    emoji: string
}

/**
 * Row of emoji buttons with flying animation
 */
export const QuickReactions = memo(function QuickReactions({
    onReact
}: QuickReactionsProps) {
    const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([])

    const handleReaction = useCallback((emoji: string) => {
        const id = Date.now()
        setFlyingEmojis(prev => [...prev, { id, emoji }])
        onReact(emoji)
    }, [onReact])

    const removeEmoji = useCallback((id: number) => {
        setFlyingEmojis(prev => prev.filter(e => e.id !== id))
    }, [])

    return (
        <>
            {/* Reaction Buttons */}
            <div className="flex justify-between px-2">
                {REACTIONS.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="text-3xl hover:scale-125 active:scale-90 transition-transform touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Flying Emojis */}
            {flyingEmojis.map(item => (
                <FlyingReaction
                    key={item.id}
                    emoji={item.emoji}
                    onComplete={() => removeEmoji(item.id)}
                />
            ))}
        </>
    )
})
