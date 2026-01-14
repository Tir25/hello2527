/**
 * Message Content Component
 * 
 * Responsibility: Renders media content based on message.media_type
 * Layer: UI Component (Presenter)
 * 
 * Handles:
 * - Image rendering with lightbox, loading states, error handling
 * - Video rendering with blob URLs for proper MIME types
 * - Audio rendering with blob URLs
 * - Document rendering with download links
 * - Expired media states
 * - Inline timestamps for media-only messages
 */

import { motion } from 'framer-motion'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'
import { useMediaBlobUrl } from '@/hooks/chat/useMediaBlobUrl'
import {
    ImageContent,
    VideoContent,
    AudioContent,
    DocumentContent,
} from './content'

interface MessageContentProps {
    message: DatabaseMessage
    isOwn: boolean
    recipientProfile?: Profile | null
    isLastMessage?: boolean
    onImageClick?: (url: string) => void
}

export const MessageContent = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    onImageClick,
}: MessageContentProps) => {
    const hasMedia = message.media_url && message.media_type
    const isExpired = message.media_type && !message.media_url
    const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER

    // Use blob URL hook for video/audio
    const { effectiveUrl } = useMediaBlobUrl({
        mediaUrl: message.media_url,
        mediaType: message.media_type,
    })

    // Handle expired media
    if (isExpired) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-2 p-3 rounded-xl border border-white/20 ${isOwn ? 'bg-white/10' : 'bg-white/20'}`}
            >
                <p className={`text-sm ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>
                    Media expired
                </p>
            </motion.div>
        )
    }

    if (!hasMedia) return null

    const displayUrl = effectiveUrl || message.media_url
    if (!displayUrl) return null

    // Shared props for content components
    const contentProps = {
        message,
        isOwn,
        recipientProfile,
        isLastMessage,
        displayUrl,
        hasTextContent: !!hasTextContent,
    }

    // Render based on media type
    switch (message.media_type) {
        case 'image':
            return (
                <ImageContent
                    {...contentProps}
                    onImageClick={onImageClick}
                />
            )

        case 'video':
            return <VideoContent {...contentProps} />

        case 'audio':
            return <AudioContent {...contentProps} />

        case 'document':
            return <DocumentContent {...contentProps} />

        default:
            return null
    }
}
