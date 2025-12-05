import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, X, Loader2, RefreshCw } from 'lucide-react'
import { MediaMenu } from '@/components/chat/MediaMenu'
import { chatService } from '@/lib/services/chat.service'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import { STORAGE, getUserFriendlyError } from '@/lib/constants/storage'
import imageCompression from 'browser-image-compression'
import { socketService } from '@/lib/services/socket.service'
import { TYPING_STOP_TIMEOUT, TYPING_THROTTLE_MS } from '@/lib/constants/typing'

interface MessageInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document') => void
  disabled?: boolean
  placeholder?: string
  receiverId?: string
}

interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'video' | 'document' | 'audio'
  error?: string
}

export const MessageInput = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  receiverId,
}: MessageInputProps) => {
  const [content, setContent] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isRequestingMic, setIsRequestingMic] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasEmittedTypingStartRef = useRef<boolean>(false)
  // CRITICAL FIX #3: Store receiverId in ref to ensure cleanup always has access
  const receiverIdRef = useRef<string | null>(null)
  // MEDIUM FIX #5: Throttle tracking for typing events
  const lastTypingEmitRef = useRef<number>(0)
  const { user } = useAuthStore()
  const { selectedUser } = useChatStore()

  const targetReceiverId = receiverId || selectedUser?.id

  // Update receiverId ref when it changes
  useEffect(() => {
    receiverIdRef.current = targetReceiverId || null
  }, [targetReceiverId])

  // CRITICAL FIX #3: Proper cleanup on unmount with ref-based receiverId
  // This ensures cleanup always has access to receiverId even if component unmounts quickly
  useEffect(() => {
    return () => {
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // Stop typing indicator using ref (always available)
      if (hasEmittedTypingStartRef.current && receiverIdRef.current) {
        socketService.emitTypingStop(receiverIdRef.current)
        hasEmittedTypingStartRef.current = false
      }
    }
  }, []) // Empty deps - only runs on unmount

  // Additional cleanup when receiverId changes
  useEffect(() => {
    // Stop typing for previous receiver
    if (hasEmittedTypingStartRef.current && receiverIdRef.current && receiverIdRef.current !== targetReceiverId) {
      socketService.emitTypingStop(receiverIdRef.current)
      hasEmittedTypingStartRef.current = false
    }
  }, [targetReceiverId])

  // CRITICAL FIX #3: Handle window/tab close events to prevent ghost typing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasEmittedTypingStartRef.current && receiverIdRef.current) {
        // Use sendBeacon for reliable delivery on page unload
        // Fallback to synchronous emit if beacon is not available
        try {
          const canUseSendBeacon = typeof navigator.sendBeacon === 'function'

          if (canUseSendBeacon) {
            // Note: sendBeacon only works with POST requests, so we'll use sync emit as fallback
            socketService.emitTypingStop(receiverIdRef.current)
          } else {
            socketService.emitTypingStop(receiverIdRef.current)
          }
        } catch {
          // Ignore errors during unload - socket may already be disconnected
        }
      }
    }

    const handleVisibilityChange = () => {
      // Stop typing when tab becomes hidden (user switched tabs/apps)
      if (document.hidden && hasEmittedTypingStartRef.current && receiverIdRef.current) {
        socketService.emitTypingStop(receiverIdRef.current)
        hasEmittedTypingStartRef.current = false
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 120
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [content])

  // MOBILE FIX: Scroll input into view when focused to prevent it being hidden by keyboard
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to ensure keyboard has started appearing
      // This prevents the input from being hidden behind the virtual keyboard
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      }, 300)
    }

    const textarea = textareaRef.current
    textarea?.addEventListener('focus', handleFocus)

    return () => {
      textarea?.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (filePreview?.preview) {
        URL.revokeObjectURL(filePreview.preview)
      }
    }
  }, [filePreview])

  // Validate file MIME type
  const validateMimeType = (file: File, type: 'image' | 'video' | 'document' | 'audio'): boolean => {
    const validTypes = STORAGE.VALID_MIME_TYPES[type as keyof typeof STORAGE.VALID_MIME_TYPES] as readonly string[]
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid ${type} file type. Allowed: ${validTypes.join(', ')}`)
      return false
    }
    return true
  }

  // Validate file size
  const validateFileSize = (file: File, type: 'image' | 'video' | 'document' | 'audio'): boolean => {
    const sizeLimit = STORAGE.SIZE_LIMITS[type]
    if (file.size > sizeLimit) {
      const sizeMB = (sizeLimit / 1024 / 1024).toFixed(0)
      toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} too large. Maximum: ${sizeMB}MB`)
      return false
    }
    return true
  }

  // Handle file selection with validation and compression
  const handleFileSelect = async (
    file: File,
    type: 'image' | 'video' | 'document' | 'audio'
  ) => {
    // Validate MIME type
    if (!validateMimeType(file, type)) {
      return
    }

    // Validate file size
    if (!validateFileSize(file, type)) {
      return
    }

    let fileToPreview = file
    let preview = ''

    // Compress images before preview
    if (type === 'image') {
      try {
        logger.info('media:compression:started', `Compressing ${file.type} - Size: ${file.size} bytes`)

        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }

        fileToPreview = await imageCompression(file, options)

        const compressionRatio = ((1 - fileToPreview.size / file.size) * 100).toFixed(1)
        logger.info(
          'media:compression:success',
          `Compressed from ${file.size} to ${fileToPreview.size} bytes (${compressionRatio}% reduction)`
        )
      } catch (error) {
        logger.error('media:compression:failed', 'Image compression failed', error)
        // Continue with original file silently
      }
    }

    // Create preview URL for images and videos
    if (type === 'image' || type === 'video') {
      preview = URL.createObjectURL(fileToPreview)
    }

    setFilePreview({ file: fileToPreview, preview, type })
    setUploadError(null)
  }

  // Handle typing events with throttling and debounce
  const handleTyping = () => {
    if (!targetReceiverId || disabled) return

    const now = Date.now()
    const timeSinceLastEmit = now - lastTypingEmitRef.current

    // MEDIUM FIX #5: Throttle typing_start emissions to prevent network spam
    // Only emit typing_start if:
    // 1. We haven't emitted it yet, OR
    // 2. It's been more than TYPING_THROTTLE_MS since last emission
    if (!hasEmittedTypingStartRef.current || timeSinceLastEmit >= TYPING_THROTTLE_MS) {
      socketService.emitTypingStart(targetReceiverId)
      hasEmittedTypingStartRef.current = true
      lastTypingEmitRef.current = now
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // MEDIUM FIX #6: Use configurable timeout instead of hardcoded value
    // Set timeout to emit typing_stop after configured inactivity period
    typingTimeoutRef.current = setTimeout(() => {
      if (hasEmittedTypingStartRef.current) {
        socketService.emitTypingStop(targetReceiverId)
        hasEmittedTypingStartRef.current = false
      }
      typingTimeoutRef.current = null
    }, TYPING_STOP_TIMEOUT)
  }

  const handleSend = async () => {
    const trimmedContent = content.trim()

    // Stop typing indicator when sending
    if (hasEmittedTypingStartRef.current && targetReceiverId) {
      socketService.emitTypingStop(targetReceiverId)
      hasEmittedTypingStartRef.current = false
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Prevent double-click
    if (isUploading) return

    if (filePreview && !isUploading) {
      await handleUploadAndSend(filePreview.file, filePreview.type, trimmedContent)
    } else if (trimmedContent && !disabled) {
      onSend(trimmedContent)
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleUploadAndSend = async (
    file: File,
    fileType: 'image' | 'video' | 'document' | 'audio',
    textContent: string = ''
  ) => {
    if (!user?.id || !targetReceiverId) {
      toast.error('Unable to send: Missing user information')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      let fileToUpload = file

      // Images are already compressed in handleFileSelect
      // But compress again if somehow we got here with uncompressed image
      if (fileType === 'image' && file.size > STORAGE.SIZE_LIMITS.image) {
        try {
          logger.info('media:compression:recompress', `Recompressing image - Size: ${file.size} bytes`)
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          }
          fileToUpload = await imageCompression(file, options)
        } catch (error) {
          logger.error('media:compression:failed', 'Recompression failed', error)
        }
      }

      // Final size validation
      const sizeLimit = STORAGE.SIZE_LIMITS[fileType]
      if (fileToUpload.size > sizeLimit) {
        const sizeMB = (sizeLimit / 1024 / 1024).toFixed(0)
        toast.error(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} too large. Maximum: ${sizeMB}MB`)
        setIsUploading(false)
        setUploadError(`File exceeds ${sizeMB}MB limit`)
        return
      }

      logger.info('media:upload:started', `Uploading ${fileType} - ${fileToUpload.size} bytes`)

      // Upload to Supabase
      const uploadResult = await chatService.uploadMedia(fileToUpload, fileType)

      if (!uploadResult.success || !uploadResult.data) {
        const errorMessage = getUserFriendlyError(uploadResult.error)
        logger.error('media:upload:failed', `Failed to upload ${fileType}: ${uploadResult.error || 'Unknown error'}`)
        toast.error(errorMessage)
        setIsUploading(false)
        setUploadError(errorMessage)
        return
      }

      logger.info(
        'media:upload:success',
        `Uploaded ${fileType} - Original: ${file.size}, Final: ${fileToUpload.size} - URL: ${uploadResult.data.publicUrl}`
      )

      // Send message with media
      const mediaType = fileType === 'image' ? 'image' : fileType === 'video' ? 'video' : fileType === 'audio' ? 'audio' : 'document'
      onSend(textContent || '', uploadResult.data.publicUrl, mediaType)

      // Reset state
      setContent('')
      setFilePreview(null)
      setUploadError(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      logger.error('MessageInput:handleUploadAndSend', 'Failed to upload and send media', error)
      const errorMessage = getUserFriendlyError(error instanceof Error ? error.message : String(error))
      toast.error(errorMessage)
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageSelect = () => {
    imageInputRef.current?.click()
  }

  const handleVideoSelect = () => {
    videoInputRef.current?.click()
  }

  const handleDocumentSelect = () => {
    documentInputRef.current?.click()
  }

  const handleFileInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'document'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file, type)
    }
    // Reset input to allow selecting the same file again
    e.target.value = ''
  }

  // Get supported MIME type for audio recording
  const getSupportedAudioMimeType = (): string | null => {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/aac',
    ]

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType
      }
    }

    return null
  }

  const startAudioRecording = async () => {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Your browser doesn't support audio recording")
      logger.error('media:recording:not-supported', 'Browser does not support getUserMedia')
      return
    }

    setIsRequestingMic(true)
    setIsMenuOpen(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsRequestingMic(false)

      // Determine supported MIME type
      const supportedMimeType = getSupportedAudioMimeType()

      if (!supportedMimeType) {
        toast.error('Audio recording not supported on your browser')
        stream.getTracks().forEach((track) => track.stop())
        logger.error('media:recording:no-mime-type', 'No supported audio MIME type found')
        return
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mimeType = supportedMimeType.split(';')[0] // Remove codecs part
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const fileExt = mimeType.split('/')[1] || 'webm'
        const audioFile = new File([audioBlob], `recording-${Date.now()}.${fileExt}`, {
          type: mimeType,
        })

        logger.info('media:recording:stopped', `Recording stopped - Size: ${audioFile.size}, Type: ${mimeType}`)
        handleFileSelect(audioFile, 'audio')
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      logger.info('media:recording:started', `Recording started with ${supportedMimeType}`)
    } catch (error) {
      setIsRequestingMic(false)
      logger.error('MessageInput:startAudioRecording', 'Failed to start recording', error)

      // Better error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please allow access in browser settings.')
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone found.')
        } else if (error.name === 'NotReadableError') {
          toast.error('Microphone is already in use by another application.')
        } else {
          toast.error('Failed to access microphone. Please check permissions.')
        }
      } else {
        toast.error('Failed to access microphone.')
      }
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const removePreview = () => {
    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview)
    }
    setFilePreview(null)
    setUploadError(null)
  }

  const retryUpload = () => {
    if (filePreview && !isUploading) {
      handleUploadAndSend(filePreview.file, filePreview.type, content.trim())
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = content.trim() || filePreview

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-chat-input flex-shrink-0 backdrop-blur-xl bg-white/70 border-t border-white/10 px-2 pt-1 safe-bottom mb-1 md:mb-1"
    >
      <div className="flex flex-col gap-2 max-w-3xl mx-auto">
        {/* File Preview */}
        <AnimatePresence>
          {filePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <div className="backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl p-2 flex items-center gap-2">
                {filePreview.type === 'image' && (
                  <img
                    src={filePreview.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                {filePreview.type === 'video' && (
                  <video
                    src={filePreview.preview}
                    className="w-16 h-16 object-cover rounded-lg"
                    muted
                  />
                )}
                {(filePreview.type === 'document' || filePreview.type === 'audio') && (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                    {filePreview.type === 'audio' ? '🎤' : '📄'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{filePreview.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploadError && !isUploading && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={retryUpload}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      aria-label="Retry upload"
                    >
                      <RefreshCw size={18} />
                    </motion.button>
                  )}
                  {!isUploading && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removePreview}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Remove preview"
                    >
                      <X size={18} />
                    </motion.button>
                  )}
                </div>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                  <div className="text-white text-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading...</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end">
          {/* Input shell with pill-shaped edges */}
          <div className="flex items-end gap-1.5 flex-1 bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl px-2.5 py-1.5 shadow-md">
            {/* Paperclip Button */}
            <div className="relative flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={disabled || isUploading || isRequestingMic}
                className={`p-3 rounded-full transition-all ${isRecording
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse'
                  : 'bg-white/50 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/70'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isRecording ? 'Recording audio - click to stop' : 'Attach media'}
                aria-pressed={isRecording}
              >
                {isRecording || isRequestingMic ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Paperclip size={20} />
                  </motion.div>
                ) : (
                  <Paperclip size={20} />
                )}
              </motion.button>

              <MediaMenu
                isOpen={isMenuOpen && !isRecording && !isRequestingMic}
                onClose={() => setIsMenuOpen(false)}
                onSelectImage={handleImageSelect}
                onSelectVideo={handleVideoSelect}
                onSelectDocument={handleDocumentSelect}
                onStartRecording={startAudioRecording}
              />

              {/* File inputs with accessibility */}
              <input
                ref={imageInputRef}
                type="file"
                accept={STORAGE.VALID_MIME_TYPES.image.join(',')}
                className="sr-only"
                aria-label="Select image file"
                onChange={(e) => handleFileInputChange(e, 'image')}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept={STORAGE.VALID_MIME_TYPES.video.join(',')}
                className="sr-only"
                aria-label="Select video file"
                onChange={(e) => handleFileInputChange(e, 'video')}
              />
              <input
                ref={documentInputRef}
                type="file"
                accept={STORAGE.VALID_MIME_TYPES.document.join(',')}
                className="sr-only"
                aria-label="Select document file"
                onChange={(e) => handleFileInputChange(e, 'document')}
              />
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  handleTyping()
                }}
                onKeyDown={handleKeyDown}
                disabled={disabled || isUploading}
                placeholder={isRecording ? 'Recording audio... (click paperclip to stop)' : placeholder}
                rows={1}
                className="w-full px-2 py-1.5 bg-transparent border-0 rounded-2xl text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto text-sm"
                style={{ minHeight: '40px', maxHeight: '100px' }}
                aria-label="Message input"
              />
              {isRecording && (
                <motion.button
                  onClick={stopAudioRecording}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                  aria-label="Stop recording"
                >
                  Stop
                </motion.button>
              )}
              {isRequestingMic && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-gray-500" />
                </div>
              )}
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={disabled || !canSend || isUploading}
              className="p-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              aria-label="Send message"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} className={canSend ? 'opacity-100' : 'opacity-50'} />
              )}
            </motion.button>
          </div>
        </div>

        {/* Screen reader announcements */}
        {isRecording && (
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            Recording audio
          </div>
        )}
        {isRequestingMic && (
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            Requesting microphone access
          </div>
        )}
      </div>
    </motion.div>
  )
}
