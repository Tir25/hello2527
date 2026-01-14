/**
 * QuickReactionBar Component
 * 
 * Floating emoji bar for quick reactions on mobile.
 * Shows 6 common reactions + "+" button for full picker.
 * 
 * Design: Instagram-style pill-shaped glassmorphism bar
 * 
 * Features:
 * - Quick access to common emojis
 * - Visual feedback animation on selection
 * - Touch-optimized with proper event handling
 * - Haptic feedback on interaction
 * 
 * @module components/chat/reactions/QuickReactionBar
 */

import { memo, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { triggerHaptic } from '@/hooks/useIsMobileUI'

/** Quick reaction emojis - matches Instagram/WhatsApp style */
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'] as const

interface QuickReactionBarProps {
    /** Callback when an emoji is selected */
    onSelect: (emoji: string) => void
    /** Callback to open full emoji picker */
    onOpenFullPicker: () => void
    /** Position to render the bar */
    position?: { x: number; y: number }
    /** Whether the bar is visible */
    isVisible?: boolean
}

const QuickReactionBarComponent = ({
    onSelect,
    onOpenFullPicker,
    position,
    isVisible = true,
}: QuickReactionBarProps) => {
    const barRef = useRef<HTMLDivElement>(null)
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)

    const handleEmojiClick = useCallback((e: React.MouseEvent | React.TouchEvent, emoji: string) => {
        // CRITICAL: Stop propagation to prevent click-outside handler from closing menu
        e.stopPropagation()
        e.preventDefault()

        // Visual feedback - show selected state briefly
        setSelectedEmoji(emoji)
        triggerHaptic('light')

        // Slight delay to show animation before closing
        setTimeout(() => {
            onSelect(emoji)
        }, 150)
    }, [onSelect])

    const handlePlusClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        // CRITICAL: Stop propagation to prevent click-outside handler from closing menu
        e.stopPropagation()
        e.preventDefault()
        triggerHaptic('light')
        onOpenFullPicker()
    }, [onOpenFullPicker])

    if (!isVisible) return null

    // Calculate position - center above the menu
    const barStyle = position ? {
        left: Math.max(16, Math.min(position.x - 120, window.innerWidth - 280)),
        top: Math.max(16, position.y - 70),
    } : {}

    return (
        <motion.div
            ref={barRef}
            data-reaction-bar="true"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[101] flex items-center gap-1 px-3 py-2
                       bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
                       rounded-full shadow-2xl border border-white/30 dark:border-white/10"
            style={barStyle}
            role="toolbar"
            aria-label="Quick reactions"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            {/* Emoji reactions */}
            <AnimatePresence>
                {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                        key={emoji}
                        onClick={(e) => handleEmojiClick(e, emoji)}
                        onTouchEnd={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleEmojiClick(e, emoji)
                        }}
                        animate={selectedEmoji === emoji ? {
                            scale: [1, 1.4, 1],
                            transition: { duration: 0.2 }
                        } : {}}
                        whileTap={{ scale: 0.85 }}
                        className={`w-10 h-10 flex items-center justify-center text-2xl
                                   rounded-full transition-colors duration-150
                                   ${selectedEmoji === emoji
                                ? 'bg-violet-100 dark:bg-violet-900/50'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        aria-label={`React with ${emoji}`}
                    >
                        {emoji}
                    </motion.button>
                ))}
            </AnimatePresence>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Plus button for full picker */}
            <motion.button
                onClick={handlePlusClick}
                onTouchEnd={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handlePlusClick(e)
                }}
                whileTap={{ scale: 0.85 }}
                className="w-10 h-10 flex items-center justify-center
                           rounded-full bg-gray-100 dark:bg-gray-800
                           hover:bg-gray-200 dark:hover:bg-gray-700
                           transition-colors duration-150"
                aria-label="More reactions"
            >
                <Plus size={20} className="text-gray-600 dark:text-gray-300" />
            </motion.button>
        </motion.div>
    )
}

export const QuickReactionBar = memo(QuickReactionBarComponent)
QuickReactionBar.displayName = 'QuickReactionBar'
