/**
 * MessageContextMenu Component
 * 
 * Context menu for message actions (edit, copy, reply, unsend, delete).
 * @module components/chat/MessageContextMenu
 */

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Ban, Copy, Pin, Reply } from 'lucide-react'
import { QuickReactionBar, ReactionPicker } from '../reactions'
import type { MessageContextMenuProps } from './types'
import { calculateMenuPosition } from './useMenuPosition'
import { useMessageActions } from './useMessageActions'
import { useClickOutside } from './useClickOutside'
import { MenuItem } from './MenuItem'
import { MenuHeader } from './MenuHeader'

export function MessageContextMenu({
    message,
    isOwn,
    position,
    onClose,
    onEdit,
    isGroup = false,
    isGroupAdmin = false,
    onReact,
}: MessageContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [showFullPicker, setShowFullPicker] = useState(false)

    // Use custom hooks
    useClickOutside({ menuRef, onClose })
    const {
        isLoading,
        handleCopy,
        handleEdit,
        handleUnsend,
        handleDeleteForMe,
        handlePin,
        handleReply,
    } = useMessageActions({ message, onClose, onEdit })

    // Handle reaction selection
    const handleReaction = useCallback((emoji: string) => {
        onReact?.(emoji)
        onClose()
    }, [onReact, onClose])

    const handleOpenFullPicker = useCallback(() => {
        setShowFullPicker(true)
    }, [])

    // Calculate position
    const menuPos = calculateMenuPosition(position)

    // Permission checks
    const canEdit = isOwn && !message.is_unsent && !message.media_url
    const canUnsend = isOwn && !message.is_unsent
    const canPin = isGroup && isGroupAdmin && !message.is_unsent
    const canReply = !message.is_unsent

    return (
        <>
            {/* Quick Reaction Bar */}
            {onReact && !message.is_unsent && !showFullPicker && (
                <QuickReactionBar
                    onSelect={handleReaction}
                    onOpenFullPicker={handleOpenFullPicker}
                    position={{ x: menuPos.x, y: menuPos.y }}
                    isVisible={true}
                />
            )}

            {/* Full Reaction Picker */}
            <ReactionPicker
                isOpen={showFullPicker}
                onClose={() => { setShowFullPicker(false); onClose() }}
                onSelect={(emoji) => { handleReaction(emoji); setShowFullPicker(false) }}
                position={{ x: menuPos.x, y: menuPos.y }}
            />

            {/* Context Menu */}
            {!showFullPicker && (
                <AnimatePresence>
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="fixed z-[100]"
                        style={{ left: menuPos.x, top: menuPos.y + (onReact && !message.is_unsent ? 60 : 0) }}
                        role="menu"
                        aria-label="Message actions"
                    >
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden min-w-[180px]">
                            <MenuHeader onClose={onClose} />

                            <div className="py-1">
                                {canEdit && (
                                    <MenuItem
                                        onClick={handleEdit}
                                        disabled={isLoading}
                                        icon={<Edit3 size={16} className="text-violet-500" />}
                                        label="Edit"
                                        hoverClass="hover:bg-violet-50 dark:hover:bg-violet-900/30"
                                    />
                                )}

                                <MenuItem
                                    onClick={handleCopy}
                                    disabled={isLoading || message.is_unsent}
                                    icon={<Copy size={16} className="text-blue-500" />}
                                    label="Copy text"
                                    hoverClass="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                />

                                {canReply && (
                                    <MenuItem
                                        onClick={handleReply}
                                        disabled={isLoading}
                                        icon={<Reply size={16} className="text-purple-500" />}
                                        label="Reply"
                                        hoverClass="hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                    />
                                )}

                                {canUnsend && (
                                    <MenuItem
                                        onClick={handleUnsend}
                                        disabled={isLoading}
                                        icon={<Ban size={16} />}
                                        label="Unsend"
                                        colorClass="text-orange-600 dark:text-orange-400"
                                        hoverClass="hover:bg-orange-50 dark:hover:bg-orange-900/30"
                                    />
                                )}

                                {canPin && (
                                    <MenuItem
                                        onClick={handlePin}
                                        disabled={isLoading}
                                        icon={<Pin size={16} />}
                                        label={message.is_pinned ? 'Unpin' : 'Pin'}
                                        colorClass="text-amber-600 dark:text-amber-400"
                                        hoverClass="hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                    />
                                )}

                                <MenuItem
                                    onClick={handleDeleteForMe}
                                    disabled={isLoading}
                                    icon={<Trash2 size={16} />}
                                    label="Delete for me"
                                    colorClass="text-red-600 dark:text-red-400"
                                    hoverClass="hover:bg-red-50 dark:hover:bg-red-900/30"
                                />
                            </div>

                            {isLoading && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </>
    )
}
