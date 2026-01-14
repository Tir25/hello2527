/**
 * VideoContent Component
 * 
 * Renders video messages with loading state, controls, and error handling.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { MediaTimestampOverlay } from './MediaTimestampOverlay'
import type { MediaContentProps } from './types'

export const VideoContent = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    displayUrl,
    hasTextContent,
}: MediaContentProps) => {
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = () => setIsLoading(false)

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

            {/* Video Player */}
            <video
                src={displayUrl}
                controls
                playsInline
                className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                preload="metadata"
                aria-label="Video message"
                onLoadedMetadata={handleLoad}
                onCanPlay={handleLoad}
                onError={() => setIsLoading(false)}
            >
                Your browser does not support the video tag.
            </video>

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
