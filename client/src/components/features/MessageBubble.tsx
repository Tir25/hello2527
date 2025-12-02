import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Download, FileText, Mic, X, Loader2, AlertCircle } from 'lucide-react'
import type { DatabaseMessage } from '@/types'
import { MEDIA_PLACEHOLDER, MEDIA_MAX_WIDTH } from '@/lib/constants/media'
import { getSanitizedFilenameFromUrl } from '@/lib/utils/media'

interface MessageBubbleProps {
  message: DatabaseMessage
  isOwn: boolean
}

interface MediaErrorState {
  hasError: boolean
  errorType: 'image' | 'video' | 'audio' | null
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [videoLoading, setVideoLoading] = useState(true)
  const [audioLoading, setAudioLoading] = useState(true)
  const [mediaError, setMediaError] = useState<MediaErrorState>({
    hasError: false,
    errorType: null,
  })

  const timestamp = new Date(message.created_at)
  const formattedTime = format(timestamp, 'h:mm a')

  // Check if media exists or if it's expired (media_type set but media_url is null)
  const hasMedia = message.media_url && message.media_type
  const isExpired = message.media_type && !message.media_url

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
    const mediaUrl = message.media_url

    // Defensive check - don't use non-null assertion
    if (!mediaUrl) return null

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
            className={`mb-2 rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative`}
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
              src={mediaUrl}
              alt={message.content || 'Shared image attachment'}
              className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
              loading="lazy"
              onClick={() => setLightboxImage(mediaUrl)}
              onLoad={() => handleMediaLoad('image')}
              onError={() => handleMediaError('image')}
            />
          </motion.div>
        )

      case 'video':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-2 rounded-xl overflow-hidden ${MEDIA_MAX_WIDTH.full} relative`}
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
              src={mediaUrl}
              controls
              className={`${MEDIA_MAX_WIDTH.full} h-auto rounded-xl ${videoLoading ? 'opacity-0' : 'opacity-100'
                }`}
              preload="metadata"
              aria-label="Video message"
              onLoadedMetadata={() => handleMediaLoad('video')}
              onError={() => handleMediaError('video')}
            >
              Your browser does not support the video tag.
            </video>
          </motion.div>
        )

      case 'audio':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-2 flex items-center gap-3 p-3 rounded-xl border border-white/20 ${MEDIA_MAX_WIDTH.full} w-full overflow-hidden ${isOwn ? 'bg-white/10' : 'bg-white/20'
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
            className={`mb-2 flex items-center gap-3 p-3 rounded-xl border border-white/20 ${isOwn ? 'bg-white/10' : 'bg-white/20'
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
            } px-4 py-2.5 shadow-lg border border-white/20`}
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

          <div
            className={`flex items-center justify-end gap-1 mt-1.5 ${isOwn ? 'text-white/80' : 'text-gray-500'
              }`}
          >
            <span className="text-xs">{formattedTime}</span>
            {isOwn && message.is_read && (
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
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
