/**
 * ImageContent Component
 * 
 * Renders image messages with loading state, error handling, and lightbox support.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { MediaTimestampOverlay } from './MediaTimestampOverlay'
import type { ImageContentProps } from './types'

export const ImageContent = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    displayUrl,
    hasTextContent,
    onImageClick,
}: ImageContentProps) => {
    const [isLoading, setIsLoading] = useState(true)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${hasTextContent ? 'mb-2' : 'mb-1'}`}
        >
            {/* Loading Spinner */}
            {isLoading && (
                <div
                    className={`absolute inset-0 flex items-center justify-center ${isOwn ? 'bg-white/5' : 'bg-gray-100/50'} rounded-xl z-10`}
                >
                    <Loader2
                        size={24}
                        className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                    />
                </div>
            )}

            {/* Image */}
            <img
                src={displayUrl}
                alt={message.content || 'Shared image attachment'}
                className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                onClick={() => onImageClick?.(displayUrl)}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
            />

            {/* Timestamp Overlay (only for media-only messages) */}
            {!hasTextContent && (
                <MediaTimestampOverlay
                    message={message}
                    isOwn={isOwn}
                    recipientProfile={recipientProfile}
                    isLastMessage={isLastMessage}
                    className="absolute bottom-2 right-2"
                />
            )}
        </motion.div>
    )
}
