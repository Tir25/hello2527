import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'
import { MessageContent } from './MessageContent'
import { MessageStatus } from './MessageStatus'
import { MessageTimestamp } from './MessageTimestamp'
import { X } from 'lucide-react'

/**
 * Message Bubble Component  
 * 
 * Responsibility: Wrapper for message layout and alignment
 * Layer: UI Component (Presenter)
 * 
 * Handles ONLY:
 * - Left/Right alignment based on isOwn
 * - Bubble styling (gradient, colors, borders)
 * - Layout composition: <MessageContent /> + text + timestamp/status
 * - Image lightbox modal
 * 
 * Does NOT handle:
 * - Media rendering (delegated to MessageContent)
 * - Status logic (delegated to MessageStatus)
 * - Timestamp formatting (delegated to MessageTimestamp)
 */

interface MessageBubbleProps {
    message: DatabaseMessage
    isOwn: boolean
    recipientProfile?: Profile | null
    isLastMessage?: boolean
}

export const MessageBubble = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
}: MessageBubbleProps) => {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)

    const hasMedia = message.media_url && message.media_type
    const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER

    const handleCloseLightbox = () => {
        setLightboxImage(null)
    }

    // Determine if we should show footer timestamp/status
    // Hide for media-only messages (timestamp is inline) or audio messages
    const shouldShowFooter = !(hasMedia && (!hasTextContent || message.media_type === 'audio'))

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}
            >
                <div
                    className={`max-w-[70%] sm:max-w-[75%] md:max-w-[60%] ${isOwn
                            ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-2xl rounded-tr-md'
                            : 'bg-white/30 backdrop-blur-sm text-gray-900 rounded-2xl rounded-tl-md'
                        } ${hasMedia && !hasTextContent ? 'p-1.5' : 'px-4 py-2.5'} shadow-lg border border-white/20`}
                >
                    {/* Media Content */}
                    <MessageContent
                        message={message}
                        isOwn={isOwn}
                        recipientProfile={recipientProfile}
                        isLastMessage={isLastMessage}
                        onImageClick={setLightboxImage}
                    />

                    {/* Text Content */}
                    {hasTextContent && (
                        <p
                            className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'
                                }`}
                        >
                            {message.content}
                        </p>
                    )}

                    {/* Footer: Timestamp + Status (only for text messages or text+media) */}
                    {shouldShowFooter && (
                        <div
                            className={`flex items-center justify-end gap-1 mt-1.5 ${isOwn ? 'text-white/80' : 'text-gray-500'
                                }`}
                        >
                            <MessageTimestamp timestamp={message.created_at} className="text-xs" />
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
                    )}
                </div>
            </motion.div>

            {/* Image Lightbox Modal */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        onClick={handleCloseLightbox}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Image lightbox"
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleCloseLightbox()
                            }}
                            aria-label="Close lightbox"
                            type="button"
                        >
                            <X size={24} className="text-white" aria-hidden="true" />
                        </motion.button>
                        <motion.img
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            src={lightboxImage}
                            alt="Full size image"
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
