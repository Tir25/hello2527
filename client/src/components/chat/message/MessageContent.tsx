import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, Mic, Loader2, AlertCircle } from 'lucide-react'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import { MEDIA_PLACEHOLDER, MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { getSanitizedFilenameFromUrl } from '@/lib/utils/media'
import { MessageStatus } from './MessageStatus'
import { MessageTimestamp } from './MessageTimestamp'

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

interface MediaErrorState {
    hasError: boolean
    errorType: 'image' | 'video' | 'audio' | null
}

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
    const [imageLoading, setImageLoading] = useState(true)
    const [videoLoading, setVideoLoading] = useState(true)
    const [audioLoading, setAudioLoading] = useState(true)
    const [mediaError, setMediaError] = useState<MediaErrorState>({
        hasError: false,
        errorType: null,
    })
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const blobUrlRef = useRef<string | null>(null)

    const hasMedia = message.media_url && message.media_type
    const isExpired = message.media_type && !message.media_url
    const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER

    // Get MIME type from URL extension
    const getMimeTypeFromUrl = (url: string, mediaType: string): string => {
        const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
        const mimeMap: Record<string, string> = {
            mp4: 'video/mp4',
            webm: 'video/webm',
            mov: 'video/quicktime',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            ogg: 'audio/ogg',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
        }

        if (ext && mimeMap[ext]) {
            return mimeMap[ext]
        }

        if (mediaType === 'video') return 'video/mp4'
        if (mediaType === 'audio') return 'audio/mpeg'
        return ''
    }

    // Create blob URL with correct MIME type for video/audio files
    const mediaUrl = message.media_url
    const mediaType = message.media_type

    useEffect(() => {
        if (!mediaUrl || !mediaType || (mediaType !== 'video' && mediaType !== 'audio')) {
            return
        }

        if (blobUrlRef.current) return

        const createBlobUrl = async () => {
            try {
                const mimeType = getMimeTypeFromUrl(mediaUrl, mediaType)
                if (!mimeType) {
                    console.warn('Could not determine MIME type for:', mediaUrl)
                    return
                }

                const response = await fetch(mediaUrl)
                if (!response.ok) {
                    console.error('Failed to fetch media:', response.statusText)
                    return
                }

                const blob = await response.blob()
                const blobWithType = new Blob([blob], { type: mimeType })
                const url = URL.createObjectURL(blobWithType)
                blobUrlRef.current = url
                setBlobUrl(url)
            } catch (error) {
                console.error('Error creating blob URL:', error)
            }
        }

        createBlobUrl()

        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current)
                blobUrlRef.current = null
                setBlobUrl(null)
            }
        }
    }, [mediaUrl, mediaType])

    const effectiveMediaUrl = useMemo(() => {
        if ((mediaType === 'video' || mediaType === 'audio') && blobUrl) {
            return blobUrl
        }
        return mediaUrl
    }, [mediaUrl, mediaType, blobUrl])

    const handleMediaError = (errorType: 'image' | 'video' | 'audio') => {
        setMediaError({ hasError: true, errorType })
        if (errorType === 'image') setImageLoading(false)
        if (errorType === 'video') setVideoLoading(false)
        if (errorType === 'audio') setAudioLoading(false)
    }

    const handleMediaLoad = (mediaType: 'image' | 'video' | 'audio') => {
        if (mediaType === 'image') setImageLoading(false)
        if (mediaType === 'video') setVideoLoading(false)
        if (mediaType === 'audio') setAudioLoading(false)
    }

    // Handle expired media
    if (isExpired) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-2 p-3 rounded-xl border border-white/20 ${isOwn ? 'bg-white/10' : 'bg-white/20'
                    }`}
            >
                <p className={`text-sm ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>
                    Media expired
                </p>
            </motion.div>
        )
    }

    if (!hasMedia) return null

    const displayUrl = effectiveMediaUrl || message.media_url
    if (!displayUrl) return null

    // Handle media errors
    if (mediaError.hasError && mediaError.errorType === mediaType) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-2 p-3 rounded-xl border border-white/20 ${isOwn ? 'bg-white/10' : 'bg-white/20'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <AlertCircle
                        size={16}
                        className={isOwn ? 'text-white/70' : 'text-gray-600'}
                    />
                    <p className={`text-sm ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>
                        Media failed to load
                    </p>
                </div>
            </motion.div>
        )
    }

    // Render based on media type
    switch (mediaType) {
        case 'image':
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${hasTextContent ? 'mb-2' : 'mb-1'
                        }`}
                >
                    {imageLoading && (
                        <div
                            className={`absolute inset-0 flex items-center justify-center ${isOwn ? 'bg-white/5' : 'bg-gray-100/50'
                                } rounded-xl z-10`}
                        >
                            <Loader2
                                size={24}
                                className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                            />
                        </div>
                    )}
                    <img
                        src={displayUrl}
                        alt={message.content || 'Shared image attachment'}
                        className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'
                            }`}
                        loading="lazy"
                        onClick={() => onImageClick?.(displayUrl)}
                        onLoad={() => handleMediaLoad('image')}
                        onError={(e) => {
                            console.error('Image load error:', {
                                src: displayUrl,
                                naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                                naturalHeight: (e.target as HTMLImageElement).naturalHeight,
                            })
                            handleMediaError('image')
                        }}
                    />
                    {!hasTextContent && (
                        <div className="absolute bottom-2 right-2 rounded-full bg-black/65 text-white text-[10px] px-2 py-0.5 shadow-sm flex items-center gap-1">
                            <MessageTimestamp timestamp={message.created_at} />
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
                </motion.div>
            )

        case 'video':
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${hasTextContent ? 'mb-2' : 'mb-1'
                        }`}
                >
                    {videoLoading && (
                        <div
                            className={`absolute inset-0 flex items-center justify-center ${isOwn ? 'bg-white/5' : 'bg-gray-100/50'
                                } rounded-xl z-10`}
                        >
                            <Loader2
                                size={24}
                                className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                            />
                        </div>
                    )}
                    <video
                        src={displayUrl}
                        controls
                        playsInline
                        className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl ${videoLoading ? 'opacity-0' : 'opacity-100'
                            }`}
                        preload="metadata"
                        aria-label="Video message"
                        onLoadedMetadata={() => handleMediaLoad('video')}
                        onCanPlay={() => handleMediaLoad('video')}
                        onError={(e) => {
                            const target = e.target as HTMLVideoElement
                            console.error('Video load error:', {
                                error: target.error,
                                code: target.error?.code,
                                message: target.error?.message,
                                networkState: target.networkState,
                                readyState: target.readyState,
                                src: displayUrl,
                                originalSrc: mediaUrl,
                                blobUrl: blobUrl || 'none',
                            })
                            handleMediaError('video')
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                    {!hasTextContent && (
                        <div className="absolute bottom-2 right-2 rounded-full bg-black/65 text-white text-[10px] px-2 py-0.5 shadow-sm flex items-center gap-1">
                            <MessageTimestamp timestamp={message.created_at} />
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
                </motion.div>
            )

        case 'audio':
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 ${MEDIA_MAX_WIDTH.full} w-full overflow-hidden ${isOwn ? 'bg-white/10' : 'bg-white/20'
                        }`}
                >
                    {audioLoading && (
                        <Loader2
                            size={20}
                            className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                        />
                    )}
                    {!audioLoading && (
                        <Mic size={20} className={isOwn ? 'text-white' : 'text-gray-700'} aria-hidden="true" />
                    )}
                    <audio
                        src={displayUrl}
                        controls
                        className="flex-1 h-8 min-w-0"
                        preload="metadata"
                        aria-label="Audio message"
                        onLoadedMetadata={() => handleMediaLoad('audio')}
                        onCanPlay={() => handleMediaLoad('audio')}
                        onError={(e) => {
                            const target = e.target as HTMLAudioElement
                            console.error('Audio load error:', {
                                error: target.error,
                                code: target.error?.code,
                                message: target.error?.message,
                                networkState: target.networkState,
                                readyState: target.readyState,
                                src: displayUrl,
                                originalSrc: mediaUrl,
                                blobUrl: blobUrl || 'none',
                            })
                            handleMediaError('audio')
                        }}
                    >
                        Your browser does not support the audio tag.
                    </audio>
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

        case 'document': {
            const sanitizedFilename = getSanitizedFilenameFromUrl(displayUrl || '')
            return (
                <motion.a
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    href={mediaUrl || ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={sanitizedFilename}
                    className={`mb-1.5 flex items-center gap-2.5 p-2.5 rounded-lg border border-white/20 ${isOwn ? 'bg-white/10' : 'bg-white/15'
                        } hover:opacity-80 transition-opacity cursor-pointer`}
                    aria-label={`Download document: ${sanitizedFilename}`}
                >
                    <FileText size={20} className={isOwn ? 'text-white' : 'text-gray-700'} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                            {sanitizedFilename}
                        </p>
                        <p className={`text-xs truncate ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                            Click to download
                        </p>
                    </div>
                    <Download size={18} className={isOwn ? 'text-white/70' : 'text-gray-500'} aria-hidden="true" />
                    {!hasTextContent && (
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
                    )}
                </motion.a>
            )
        }

        default:
            return null
    }
}
