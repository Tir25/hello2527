import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, Mic, X, Loader2, AlertCircle } from 'lucide-react'
import type { DatabaseMessage } from '@/types'
import { MEDIA_PLACEHOLDER, MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { getSanitizedFilenameFromUrl } from '@/lib/utils/media'
import { MessageStatus } from './MessageStatus'
import { MessageTimestamp } from './MessageTimestamp'
import type { Profile } from '@/lib/services/profile.service'

interface MessageContentProps {
  message: DatabaseMessage
  isOwn: boolean
  recipientProfile?: Profile | null
  isLastMessage?: boolean
  onImageClick?: (imageUrl: string) => void
}

interface MediaErrorState {
  hasError: boolean
  errorType: 'image' | 'video' | 'audio' | null
}

/**
 * Presenter component for rendering message content (text, images, videos, audio, documents)
 * Handles all media type rendering logic
 */
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<MediaErrorState>({
    hasError: false,
    errorType: null,
  })

  const hasMedia = message.media_url && message.media_type
  const isExpired = message.media_type && !message.media_url
  const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER

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

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl)
    onImageClick?.(imageUrl)
  }

  const handleCloseLightbox = () => {
    setLightboxImage(null)
  }

  // Validate status with fallback
  const getValidStatus = (): 'sent' | 'delivered' | 'seen' => {
    return (message.status && ['sent', 'delivered', 'seen'].includes(message.status) ? message.status : 'sent') as
      | 'sent'
      | 'delivered'
      | 'seen'
  }

  const renderMedia = () => {
    if (isExpired) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-2 p-3 rounded-xl border border-white/20 ${
            isOwn ? 'bg-white/10' : 'bg-white/20'
          }`}
        >
          <p className={`text-sm ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>Media expired</p>
        </motion.div>
      )
    }

    if (!hasMedia) return null

    const mediaType = message.media_type
    const mediaUrl = message.media_url

    if (!mediaUrl) return null

    if (mediaError.hasError && mediaError.errorType === mediaType) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-2 p-3 rounded-xl border border-white/20 ${
            isOwn ? 'bg-white/10' : 'bg-white/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className={isOwn ? 'text-white/70' : 'text-gray-600'} />
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
            className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${
              hasTextContent ? 'mb-2' : 'mb-1'
            }`}
          >
            {imageLoading && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${
                  isOwn ? 'bg-white/5' : 'bg-gray-100/50'
                } rounded-xl z-10`}
              >
                <Loader2
                  size={24}
                  className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                />
              </div>
            )}
            <img
              src={mediaUrl}
              alt={message.content || 'Shared image attachment'}
              className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
              onClick={() => handleImageClick(mediaUrl)}
              onLoad={() => handleMediaLoad('image')}
              onError={() => handleMediaError('image')}
            />
            {!hasTextContent && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <div className="rounded-full bg-black/65 text-white shadow-sm px-2 py-0.5">
                  <MessageTimestamp timestamp={message.created_at} size="xs" />
                </div>
                {isOwn && (
                  <div className="rounded-full bg-black/65 p-0.5 shadow-sm">
                    <MessageStatus
                      status={getValidStatus()}
                      recipientAvatar={recipientProfile?.avatar_url || null}
                      recipientThemeColor={recipientProfile?.theme_color || 'rgb(139, 92, 246)'}
                      isLastMessage={isLastMessage}
                    />
                  </div>
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
            className={`rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative ${
              hasTextContent ? 'mb-2' : 'mb-1'
            }`}
          >
            {videoLoading && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${
                  isOwn ? 'bg-white/5' : 'bg-gray-100/50'
                } rounded-xl z-10`}
              >
                <Loader2
                  size={24}
                  className={`animate-spin ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                />
              </div>
            )}
            <video
              src={mediaUrl}
              controls
              className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl ${
                videoLoading ? 'opacity-0' : 'opacity-100'
              }`}
              preload="metadata"
              aria-label="Video message"
              onLoadedMetadata={() => handleMediaLoad('video')}
              onError={() => handleMediaError('video')}
            >
              Your browser does not support the video tag.
            </video>
            {!hasTextContent && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <div className="rounded-full bg-black/65 text-white shadow-sm px-2 py-0.5">
                  <MessageTimestamp timestamp={message.created_at} size="xs" />
                </div>
                {isOwn && (
                  <div className="rounded-full bg-black/65 p-0.5 shadow-sm">
                    <MessageStatus
                      status={getValidStatus()}
                      recipientAvatar={recipientProfile?.avatar_url || null}
                      recipientThemeColor={recipientProfile?.theme_color || 'rgb(139, 92, 246)'}
                      isLastMessage={isLastMessage}
                    />
                  </div>
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
            className={`mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 ${MEDIA_MAX_WIDTH.full} w-full overflow-hidden ${
              isOwn ? 'bg-white/10' : 'bg-white/20'
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
              src={mediaUrl}
              controls
              className="flex-1 h-8 min-w-0"
              preload="metadata"
              aria-label="Audio message"
              onLoadedMetadata={() => handleMediaLoad('audio')}
              onError={() => handleMediaError('audio')}
            >
              Your browser does not support the audio tag.
            </audio>
            <MessageTimestamp
              timestamp={message.created_at}
              size="xs"
              className={`ml-2 ${isOwn ? 'text-white/80' : 'text-gray-600'}`}
            />
            {isOwn && (
              <span className="ml-1">
                <MessageStatus
                  status={getValidStatus()}
                  recipientAvatar={recipientProfile?.avatar_url || null}
                  recipientThemeColor={recipientProfile?.theme_color || 'rgb(139, 92, 246)'}
                  isLastMessage={isLastMessage}
                />
              </span>
            )}
          </motion.div>
        )

      case 'document': {
        const sanitizedFilename = getSanitizedFilenameFromUrl(mediaUrl)
        return (
          <motion.a
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={sanitizedFilename}
            className={`mb-1.5 flex items-center gap-2.5 p-2.5 rounded-lg border border-white/20 ${
              isOwn ? 'bg-white/10' : 'bg-white/15'
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
                  size="xs"
                  className={isOwn ? 'text-white/80' : 'text-gray-600'}
                />
                {isOwn && (
                  <MessageStatus
                    status={getValidStatus()}
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
      {renderMedia()}
      {hasTextContent && (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </p>
      )}
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

