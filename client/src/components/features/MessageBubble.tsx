import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Download, FileText, Mic, X, Loader2, AlertCircle } from 'lucide-react'
import type { DatabaseMessage } from '@/types'
import { MEDIA_PLACEHOLDER, MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { getSanitizedFilenameFromUrl } from '@/lib/utils/media'
import { MessageStatus } from '@/components/chat/MessageStatus'
import type { Profile } from '@/lib/services/profile.service'

interface MessageBubbleProps {
  message: DatabaseMessage
  isOwn: boolean
  recipientProfile?: Profile | null
  isLastMessage?: boolean
}

interface MediaErrorState {
  hasError: boolean
  errorType: 'image' | 'video' | 'audio' | null
}

export const MessageBubble = ({ message, isOwn, recipientProfile, isLastMessage = false }: MessageBubbleProps) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [videoLoading, setVideoLoading] = useState(true)
  const [audioLoading, setAudioLoading] = useState(true)
  const [mediaError, setMediaError] = useState<MediaErrorState>({
    hasError: false,
    errorType: null,
  })
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const timestamp = new Date(message.created_at)
  const formattedTime = format(timestamp, 'h:mm a')

  // Check if media exists or if it's expired (media_type set but media_url is null)
  const hasMedia = message.media_url && message.media_type
  const isExpired = message.media_type && !message.media_url
  const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER

  // Handle lightbox close - extracted to avoid duplication
  const handleCloseLightbox = () => {
    setLightboxImage(null)
  }

  // Handle media errors - show expired state for broken URLs
  const handleMediaError = (errorType: 'image' | 'video' | 'audio') => {
    setMediaError({ hasError: true, errorType })
    if (errorType === 'image') setImageLoading(false)
    if (errorType === 'video') setVideoLoading(false)
    if (errorType === 'audio') setAudioLoading(false)
  }

  // Handle successful media load
  const handleMediaLoad = (mediaType: 'image' | 'video' | 'audio') => {
    if (mediaType === 'image') setImageLoading(false)
    if (mediaType === 'video') setVideoLoading(false)
    if (mediaType === 'audio') setAudioLoading(false)
  }

  // Get MIME type from URL extension
  const getMimeTypeFromUrl = (url: string, mediaType: string): string => {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0] // Remove query params
    const mimeMap: Record<string, string> = {
      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      // 'ogg': 'video/ogg', // Duplicate - commented, using audio/ogg
      'mov': 'video/quicktime',
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      // 'webm': 'audio/webm', // Duplicate - commented, using video/webm
    }

    if (ext && mimeMap[ext]) {
      return mimeMap[ext]
    }

    // Fallback based on media type
    if (mediaType === 'video') return 'video/mp4'
    if (mediaType === 'audio') return 'audio/mpeg'
    return ''
  }

  // Create blob URL with correct MIME type for video/audio files
  // This fixes files uploaded without proper Content-Type headers
  const mediaUrl = message.media_url
  const mediaType = message.media_type

  useEffect(() => {
    if (!mediaUrl || !mediaType || (mediaType !== 'video' && mediaType !== 'audio')) {
      return
    }

    // Only create blob URL if we don't have one yet
    if (blobUrlRef.current) return

    const createBlobUrl = async () => {
      try {
        const mimeType = getMimeTypeFromUrl(mediaUrl, mediaType)
        if (!mimeType) {
          console.warn('Could not determine MIME type for:', mediaUrl)
          return
        }

        // Fetch the file
        const response = await fetch(mediaUrl)
        if (!response.ok) {
          console.error('Failed to fetch media:', response.statusText)
          return
        }

        // Create blob with correct MIME type
        const blob = await response.blob()
        const blobWithType = new Blob([blob], { type: mimeType })
        const url = URL.createObjectURL(blobWithType)
        blobUrlRef.current = url
        setBlobUrl(url)
      } catch (error) {
        console.error('Error creating blob URL:', error)
        // Fallback to original URL if blob creation fails
      }
    }

    createBlobUrl()

    // Cleanup blob URL on unmount or when URL changes
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
        setBlobUrl(null)
      }
    }
  }, [mediaUrl, mediaType])

  // Use blob URL for video/audio if available, otherwise use original URL
  const effectiveMediaUrl = useMemo(() => {
    if ((mediaType === 'video' || mediaType === 'audio') && blobUrl) {
      return blobUrl
    }
    return mediaUrl
  }, [mediaUrl, mediaType, blobUrl])

  const renderMedia = () => {
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

    const mediaType = message.media_type
    const displayUrl = effectiveMediaUrl || message.media_url

    // Defensive check - don't use non-null assertion
    if (!displayUrl) return null

    // Handle media errors - show expired state
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

    switch (mediaType) {
      case 'image':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${hasTextContent ? 'mb-2' : 'mb-1'}`}
          >
            {imageLoading && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${isOwn ? 'bg-white/5' : 'bg-gray-100/50'
                  } rounded-xl z-10`}
              >
                <Loader2
                  size={24}
                  className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'
                    }`}
                />
              </div>
            )}
            <img
              src={displayUrl}
              alt={message.content || 'Shared image attachment'}
              className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
              loading="lazy"
              onClick={() => setLightboxImage(displayUrl)}
              onLoad={() => handleMediaLoad('image')}
              onError={(e) => {
                console.error('Image load error:', {
                  src: displayUrl,
                  naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                  naturalHeight: (e.target as HTMLImageElement).naturalHeight
                })
                handleMediaError('image')
              }}
            />
            {/* Inline timestamp overlay for image-only messages */}
            {!hasTextContent && (
              <div className="absolute bottom-2 right-2 rounded-full bg-black/65 text-white text-[10px] px-2 py-0.5 shadow-sm flex items-center gap-1">
                <span>{formattedTime}</span>
                {isOwn && (
                  <MessageStatus
                    status={(['sent', 'delivered', 'seen'].includes(message.status) ? message.status : 'sent') as 'sent' | 'delivered' | 'seen'}
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
            className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${hasTextContent ? 'mb-2' : 'mb-1'}`}
          >
            {videoLoading && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${isOwn ? 'bg-white/5' : 'bg-gray-100/50'
                  } rounded-xl z-10`}
              >
                <Loader2
                  size={24}
                  className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'
                    }`}
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
                  blobUrl: blobUrl || 'none'
                })
                handleMediaError('video')
              }}
            >
              Your browser does not support the video tag.
            </video>
            {/* Inline timestamp overlay for video-only messages */}
            {!hasTextContent && (
              <div className="absolute bottom-2 right-2 rounded-full bg-black/65 text-white text-[10px] px-2 py-0.5 shadow-sm flex items-center gap-1">
                <span>{formattedTime}</span>
                {isOwn && (
                  <MessageStatus
                    status={(['sent', 'delivered', 'seen'].includes(message.status) ? message.status : 'sent') as 'sent' | 'delivered' | 'seen'}
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
                className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'
                  }`}
              />
            )}
            {!audioLoading && (
              <Mic
                size={20}
                className={isOwn ? 'text-white' : 'text-gray-700'}
                aria-hidden="true"
              />
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
                  blobUrl: blobUrl || 'none'
                })
                handleMediaError('audio')
              }}
            >
              Your browser does not support the audio tag.
            </audio>
            {/* Inline timestamp for audio messages */}
            <div className="ml-2 flex items-center gap-1">
              <span className={`text-[10px] whitespace-nowrap ${isOwn ? 'text-white/80' : 'text-gray-600'}`}>
                {formattedTime}
              </span>
              {isOwn && (
                <MessageStatus
                  status={(['sent', 'delivered', 'seen'].includes(message.status) ? message.status : 'sent') as 'sent' | 'delivered' | 'seen'}
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
            <FileText
              size={20}
              className={isOwn ? 'text-white' : 'text-gray-700'}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                {sanitizedFilename}
              </p>
              <p className={`text-xs truncate ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                Click to download
              </p>
            </div>
            <Download
              size={18}
              className={isOwn ? 'text-white/70' : 'text-gray-500'}
              aria-hidden="true"
            />
            {/* Inline timestamp for document-only messages */}
            {!hasTextContent && (
              <div className="ml-2 flex items-center gap-1">
                <span className={`text-[10px] whitespace-nowrap ${isOwn ? 'text-white/80' : 'text-gray-600'}`}>
                  {formattedTime}
                </span>
                {isOwn && (
                  <MessageStatus
                    status={(['sent', 'delivered', 'seen'].includes(message.status) ? message.status : 'sent') as 'sent' | 'delivered' | 'seen'}
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
          {renderMedia()}

          {message.content && message.content !== MEDIA_PLACEHOLDER && (
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'
                }`}
            >
              {message.content}
            </p>
          )}

          {/* Footer timestamp/read status
              - Hidden for media-only messages where time is inline
              - Also hidden for audio messages (audio always shows time inside its row)
              - NEW LOW #2: Media-only messages intentionally don't show status indicator
                (design choice - inline timestamp used instead). Animation optimization
                (isLastMessage) applies to text messages and messages with both text and media.
          */}
          {!(hasMedia && (!hasTextContent || message.media_type === 'audio')) && (
            <div
              className={`flex items-center justify-end gap-1 mt-1.5 ${isOwn ? 'text-white/80' : 'text-gray-500'
                }`}
            >
              <span className="text-xs">{formattedTime}</span>
              {/* Liquid/Organic Message Status Indicator */}
              {isOwn && (
                <MessageStatus
                  status={
                    // HIGH #3: Runtime status validation with fallback
                    (['sent', 'delivered', 'seen'].includes(message.status)
                      ? message.status
                      : 'sent') as 'sent' | 'delivered' | 'seen'
                  }
                  recipientAvatar={recipientProfile?.avatar_url || null}
                  recipientThemeColor={
                    // MEDIUM #1: Support theme color from profile (future enhancement)
                    // For now, use default purple/violet theme
                    recipientProfile?.theme_color || 'rgb(139, 92, 246)'
                  }
                  isLastMessage={isLastMessage} // MEDIUM #2: Only animate last message for performance
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
