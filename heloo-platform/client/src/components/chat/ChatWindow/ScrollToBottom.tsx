/**
 * ScrollToBottom Component
 * 
 * Floating button that appears when user scrolls up in chat.
 * Clicking it smoothly scrolls to the latest messages.
 * 
 * Features:
 * - Shows unread message count badge
 * - Animates in/out smoothly
 * - Accessible with keyboard
 * 
 * Responsibility: Scroll navigation in chat
 * Layer: UI Component (Presenter)
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ScrollToBottomProps {
    /** Whether the button should be visible */
    visible: boolean
    /** Number of unread messages (shows as badge) */
    unreadCount?: number
    /** Click handler to scroll to bottom */
    onClick: () => void
    /** Additional CSS classes */
    className?: string
}

const ScrollToBottomComponent = ({
    visible,
    unreadCount = 0,
    onClick,
    className,
}: ScrollToBottomProps) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={onClick}
                    className={cn(
                        "absolute bottom-4 right-4 z-10",
                        "w-10 h-10 rounded-full",
                        "bg-white shadow-lg border border-gray-200",
                        "flex items-center justify-center",
                        "hover:bg-gray-50 active:scale-95",
                        "transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400",
                        className
                    )}
                    aria-label={unreadCount > 0
                        ? `Scroll to bottom, ${unreadCount} new messages`
                        : "Scroll to bottom"
                    }
                >
                    <ChevronDown className="w-5 h-5 text-gray-600" />

                    {/* Unread badge */}
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                                      bg-purple-500 text-white text-[10px] font-bold
                                      rounded-full flex items-center justify-center px-1"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </motion.button>
            )}
        </AnimatePresence>
    )
}

export const ScrollToBottom = memo(ScrollToBottomComponent)
ScrollToBottom.displayName = 'ScrollToBottom'
