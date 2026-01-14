/**
 * ReplyPreview Component
 * 
 * Responsibility: Display the message being replied to above the input
 * Layer: UI Component (View)
 * 
 * Features:
 * - Shows preview of message being replied to
 * - Close button to cancel reply
 * - Visual indicator for media replies
 * - Truncated content preview
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { X, Reply, Image, Video, FileAudio, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { DatabaseMessage } from '@/types'

interface ReplyPreviewProps {
    /** Message being replied to */
    message: DatabaseMessage
    /** Current user's name (to show "You" for own messages) */
    currentUserId?: string
    /** Close/cancel callback */
    onClose: () => void
    /** Additional CSS classes */
    className?: string
}

const getMediaIcon = (mediaType: string | null | undefined) => {
    switch (mediaType) {
        case 'image':
            return Image
        case 'video':
            return Video
        case 'audio':
            return FileAudio
        case 'document':
            return FileText
        default:
            return null
    }
}

const getMediaLabel = (mediaType: string | null | undefined): string => {
    switch (mediaType) {
        case 'image':
            return 'Photo'
        case 'video':
            return 'Video'
        case 'audio':
            return 'Audio'
        case 'document':
            return 'Document'
        default:
            return ''
    }
}

const ReplyPreviewComponent = ({
    message,
    currentUserId,
    onClose,
    className,
}: ReplyPreviewProps) => {
    // Determine sender display name
    const isOwnMessage = message.sender_id === currentUserId
    const senderName = isOwnMessage
        ? 'You'
        : message.sender_name || 'User'

    // Get media info if present
    const MediaIcon = getMediaIcon(message.media_type)
    const mediaLabel = getMediaLabel(message.media_type)

    // Format content preview
    const contentPreview = message.content?.trim() || mediaLabel

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
                "flex items-stretch gap-2 px-3 py-2 bg-gray-50 rounded-xl",
                "border-l-4 border-purple-400",
                className
            )}
        >
            {/* Reply icon */}
            <Reply className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />

            {/* Content preview */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-purple-600">
                    Replying to {senderName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {MediaIcon && (
                        <MediaIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <p className="text-sm text-gray-600 truncate">
                        {contentPreview}
                    </p>
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full 
                          hover:bg-gray-200 transition-colors self-center flex-shrink-0"
                aria-label="Cancel reply"
            >
                <X className="w-4 h-4 text-gray-500" />
            </button>
        </motion.div>
    )
}

export const ReplyPreview = memo(ReplyPreviewComponent)
ReplyPreview.displayName = 'ReplyPreview'
