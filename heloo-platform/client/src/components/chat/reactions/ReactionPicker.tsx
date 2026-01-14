/**
 * ReactionPicker Component
 * 
 * Emoji picker popup for adding reactions to messages.
 * Features:
 * - Common emoji grid
 * - Click to add reaction
 * - Positioned near message
 * 
 * @module components/chat/reactions/ReactionPicker
 */

import { memo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

/** Common reaction emojis */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏']

interface ReactionPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (emoji: string) => void
    position?: { x: number; y: number }
    className?: string
}

const ReactionPickerComponent = ({
    isOpen,
    onClose,
    onSelect,
    position,
    className,
}: ReactionPickerProps) => {
    const pickerRef = useRef<HTMLDivElement>(null)

    // Close on click/touch outside
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement
            if (pickerRef.current && !pickerRef.current.contains(target)) {
                onClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        // Use both mouse and touch events for cross-device compatibility
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    const handleSelect = useCallback((emoji: string) => {
        onSelect(emoji)
        onClose()
    }, [onSelect, onClose])

    // Calculate position to stay within viewport
    const getPosition = () => {
        if (!position) return {}

        const pickerWidth = 260
        const pickerHeight = 50
        const padding = 10

        let x = position.x
        let y = position.y

        // Adjust for right edge
        if (x + pickerWidth + padding > window.innerWidth) {
            x = window.innerWidth - pickerWidth - padding
        }

        // Adjust for bottom edge
        if (y + pickerHeight + padding > window.innerHeight) {
            y = position.y - pickerHeight - 10
        }

        // Ensure not off-screen
        x = Math.max(padding, x)
        y = Math.max(padding, y)

        return { left: x, top: y }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                        "fixed z-[100] bg-white/95 backdrop-blur-xl rounded-full",
                        "shadow-xl border border-gray-200/50 px-2 py-1.5",
                        className
                    )}
                    style={getPosition()}
                    role="listbox"
                    aria-label="Select reaction"
                >
                    <div className="flex gap-0.5">
                        {REACTION_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleSelect(emoji)}
                                className="w-9 h-9 flex items-center justify-center text-xl
                                          rounded-full hover:bg-gray-100 active:scale-90
                                          transition-all"
                                role="option"
                                aria-label={`React with ${emoji}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export const ReactionPicker = memo(ReactionPickerComponent)
ReactionPicker.displayName = 'ReactionPicker'
