/**
 * ReplyContext Component
 * 
 * Displays quoted message inside a message bubble.
 * 
 * Features:
 * - Compact display of original message
 * - Click to scroll to original
 * - Visual distinction from main message
 * - Support for media message previews
 * - High contrast text for readability
 */

import { memo } from 'react'
import { Image, Video, FileAudio, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ReplyToMessage } from '@/types/database.types'

interface ReplyContextProps {
    replyTo: ReplyToMessage
    currentUserId?: string
    isOwn?: boolean
    onClick?: () => void
    className?: string
}

const getMediaIcon = (mediaType: string | null | undefined) => {
    switch (mediaType) {
        case 'image': return Image
        case 'video': return Video
        case 'audio': return FileAudio
        case 'document': return FileText
        default: return null
    }
}

const getMediaLabel = (mediaType: string | null | undefined): string => {
    switch (mediaType) {
        case 'image': return 'Photo'
        case 'video': return 'Video'
        case 'audio': return 'Audio'
        case 'document': return 'Document'
        default: return ''
    }
}

const ReplyContextComponent = ({
    replyTo,
    currentUserId,
    isOwn = false,
    onClick,
    className,
}: ReplyContextProps) => {
    const isOwnReply = replyTo.sender_id === currentUserId
    const senderName = isOwnReply ? 'You' : replyTo.sender_name || 'User'

    const MediaIcon = getMediaIcon(replyTo.media_type)
    const mediaLabel = getMediaLabel(replyTo.media_type)

    const contentPreview = replyTo.content?.trim() || mediaLabel
    const truncatedContent = contentPreview.length > 60
        ? contentPreview.slice(0, 60) + '...'
        : contentPreview

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-3 py-2 mb-2 rounded-lg overflow-hidden",
                "border-l-4 transition-all duration-150",
                isOwn
                    ? "bg-white/15 border-white/50 hover:bg-white/20"
                    : "bg-gray-50 border-purple-400 hover:bg-gray-100",
                "cursor-pointer active:scale-[0.99]",
                className
            )}
            aria-label={`Reply to ${senderName}: ${truncatedContent}`}
        >
            {/* Sender name */}
            <p className={cn(
                "text-xs font-semibold mb-0.5",
                isOwn ? "text-white/90" : "text-purple-600"
            )}>
                {senderName}
            </p>

            {/* Content preview */}
            <div className="flex items-center gap-1.5">
                {MediaIcon && (
                    <MediaIcon className={cn(
                        "w-3.5 h-3.5 flex-shrink-0",
                        isOwn ? "text-white/70" : "text-gray-500"
                    )} />
                )}
                <p className={cn(
                    "text-xs truncate",
                    isOwn ? "text-white/80" : "text-gray-600"
                )}>
                    {truncatedContent}
                </p>
            </div>
        </button>
    )
}

export const ReplyContext = memo(ReplyContextComponent)
ReplyContext.displayName = 'ReplyContext'
