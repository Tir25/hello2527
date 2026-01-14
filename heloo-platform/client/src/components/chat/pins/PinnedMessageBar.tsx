/**
 * PinnedMessageBar Component
 * 
 * Displays pinned messages at the top of the chat window.
 * Features: Shows latest pinned message, click to scroll, expandable list.
 * 
 * @module components/chat/pins/PinnedMessageBar
 */

import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, ChevronDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { PinnedMessageBarProps } from './types'
import { usePinnedMessages } from './usePinnedMessages'

const PinnedMessageBarComponent = ({
    conversationId,
    currentUserId,
    isGroup = false,
    canUnpin = false,
    onMessageClick,
    className,
}: PinnedMessageBarProps) => {
    const [expanded, setExpanded] = useState(false)

    const { pinnedMessages, loading, unpinning, handleUnpin } = usePinnedMessages({
        conversationId,
        currentUserId,
        isGroup,
    })

    // Don't render if loading or no pinned messages
    if (loading || pinnedMessages.length === 0) return null

    const latestPinned = pinnedMessages[0]
    const hasMultiple = pinnedMessages.length > 1

    const handleBarClick = () => {
        hasMultiple ? setExpanded(!expanded) : onMessageClick?.(latestPinned.id)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleBarClick()
        }
    }

    return (
        <div className={cn("border-b border-gray-200/50 bg-amber-50/50", className)}>
            {/* Main pinned message bar */}
            <div
                role="button"
                tabIndex={0}
                onClick={handleBarClick}
                onKeyDown={handleKeyDown}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-100/50 
                          transition-colors text-left cursor-pointer"
            >
                <Pin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{latestPinned.content}</p>
                    <p className="text-xs text-gray-500">
                        Pinned by {latestPinned.sender_name}
                        {hasMultiple && ` • ${pinnedMessages.length} pinned messages`}
                    </p>
                </div>
                {hasMultiple && (
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", expanded && "rotate-180")} />
                )}
                {canUnpin && !hasMultiple && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleUnpin(latestPinned.id) }}
                        disabled={unpinning === latestPinned.id}
                        className="p-1.5 rounded-full hover:bg-amber-200/50 transition-colors"
                        aria-label="Unpin message"
                    >
                        {unpinning === latestPinned.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            : <X className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                )}
            </div>

            {/* Expanded list */}
            <AnimatePresence>
                {expanded && hasMultiple && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-2 space-y-1">
                            {pinnedMessages.map(msg => (
                                <div
                                    key={msg.id}
                                    className="flex items-center gap-2 p-2 rounded-lg 
                                              hover:bg-amber-100/50 transition-colors group"
                                >
                                    <button
                                        onClick={() => onMessageClick?.(msg.id)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <p className="text-sm text-gray-800 truncate">{msg.content}</p>
                                    </button>
                                    {canUnpin && (
                                        <button
                                            onClick={() => handleUnpin(msg.id)}
                                            disabled={unpinning === msg.id}
                                            className="p-1 rounded-full opacity-0 group-hover:opacity-100
                                                      hover:bg-amber-200/50 transition-all"
                                            aria-label="Unpin"
                                        >
                                            {unpinning === msg.id
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <X className="w-3 h-3 text-amber-600" />}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export const PinnedMessageBar = memo(PinnedMessageBarComponent)
PinnedMessageBar.displayName = 'PinnedMessageBar'
