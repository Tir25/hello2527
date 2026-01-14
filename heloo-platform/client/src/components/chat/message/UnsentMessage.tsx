/**
 * Unsent Message View
 * 
 * Responsibility: Display deleted/unsent message placeholder
 * Layer: UI Component (Presenter)
 * 
 * Extracted from MessageBubble.tsx for modularity.
 */

import { motion } from 'framer-motion'
import { Ban } from 'lucide-react'
import type { DatabaseMessage } from '@/types'
import { MessageTimestamp } from './MessageTimestamp'
import { MessageContextMenu } from '../MessageContextMenu'

interface UnsentMessageProps {
    message: DatabaseMessage
    isOwn: boolean
    contextMenuPosition: { x: number; y: number } | null
    onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void
    onCloseContextMenu: () => void
    onStartEditing: () => void
    longPressHandlers: React.HTMLAttributes<HTMLDivElement>
}

export const UnsentMessage = ({
    message,
    isOwn,
    contextMenuPosition,
    onContextMenu: _onContextMenu,
    onCloseContextMenu,
    onStartEditing,
    longPressHandlers,
}: UnsentMessageProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-3 sm:px-4`}
        >
            <div
                className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-3 
                    ${isOwn
                        ? 'bg-gray-400/30 rounded-2xl rounded-tr-md'
                        : 'bg-gray-300/30 rounded-2xl rounded-tl-md'
                    } shadow-lg border border-white/10`}
                {...longPressHandlers}
            >
                <div className="flex items-center gap-2">
                    <Ban size={16} className="text-gray-500 flex-shrink-0" />
                    <p className="text-base sm:text-sm italic text-gray-500">
                        This message was deleted
                    </p>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-2 text-gray-400">
                    <MessageTimestamp timestamp={message.created_at} className="text-[11px] sm:text-xs" />
                </div>
            </div>

            {contextMenuPosition && (
                <MessageContextMenu
                    message={message}
                    isOwn={isOwn}
                    position={contextMenuPosition}
                    onClose={onCloseContextMenu}
                    onEdit={onStartEditing}
                />
            )}
        </motion.div>
    )
}
