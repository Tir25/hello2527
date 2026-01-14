/**
 * AudioContent Component
 * 
 * Renders audio messages with playback controls and loading state.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Loader2 } from 'lucide-react'
import { MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { MessageStatus } from '../MessageStatus'
import { MessageTimestamp } from '../MessageTimestamp'
import type { MediaContentProps } from './types'

export const AudioContent = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    displayUrl,
}: MediaContentProps) => {
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = () => setIsLoading(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 ${MEDIA_MAX_WIDTH.full} w-full overflow-hidden ${isOwn ? 'bg-white/10' : 'bg-white/20'}`}
        >
            {/* Icon/Loading */}
            {isLoading ? (
                <Loader2
                    size={20}
                    className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                />
            ) : (
                <Mic size={20} className={isOwn ? 'text-white' : 'text-gray-700'} aria-hidden="true" />
            )}

            {/* Audio Player */}
            <audio
                src={displayUrl}
                controls
                className="flex-1 h-8 min-w-0"
                preload="metadata"
                aria-label="Audio message"
                onLoadedMetadata={handleLoad}
                onCanPlay={handleLoad}
                onError={() => setIsLoading(false)}
            >
                Your browser does not support the audio tag.
            </audio>

            {/* Timestamp & Status */}
            <div className="ml-2 flex items-center gap-1">
                <MessageTimestamp
                    timestamp={message.created_at}
                    className={`text-[10px] whitespace-nowrap ${isOwn ? 'text-white/80' : 'text-gray-600'}`}
                />
                {isOwn && (
                    <MessageStatus
                        status={
                            (['sent', 'delivered', 'seen'].includes(message.status)
                                ? message.status
                                : 'sent') as 'sent' | 'delivered' | 'seen'
                        }
                        recipientAvatar={recipientProfile?.avatar_url || null}
                        recipientThemeColor={recipientProfile?.theme_color || 'rgb(139, 92, 246)'}
                        isLastMessage={isLastMessage}
                    />
                )}
            </div>
        </motion.div>
    )
}
