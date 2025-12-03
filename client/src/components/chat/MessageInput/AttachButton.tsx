import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Paperclip } from 'lucide-react'
import { MediaMenu } from '@/components/chat/MediaMenu'
import { STORAGE } from '@/lib/constants/storage'

/**
 * Attach Button Component
 * 
 * Responsibility: Paperclip button with MediaMenu popup and file inputs
 * Layer: UI Component (View)
 * 
 * Props:
 * - isOpen: Menu open state
 * - onToggle: Toggle menu callback
 * - disabled: Button disabled state
 * - isRecording: Recording in progress
 * - isRequestingMic: Requesting mic permission
 * - onSelectImage: Image selection callback
 * - onSelectVideo: Video selection callback
 * - onSelectDocument: Document selection callback
 * - onStartRecording: Start recording callback
 * - onFileSelect: File selection callback (from input)
 */

interface AttachButtonProps {
    isOpen: boolean
    onToggle: () => void
    disabled: boolean
    isRecording: boolean
    isRequestingMic: boolean
    onSelectImage: () => void
    onSelectVideo: () => void
    onSelectDocument: () => void
    onStartRecording: () => void
    onFileSelect: (file: File, type: 'image' | 'video' | 'document') => void
}

export const AttachButton = ({
    isOpen,
    onToggle,
    disabled,
    isRecording,
    isRequestingMic,
    onSelectImage,
    onSelectVideo,
    onSelectDocument,
    onStartRecording,
    onFileSelect,
}: AttachButtonProps) => {
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const documentInputRef = useRef<HTMLInputElement>(null)

    const handleFileInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'image' | 'video' | 'document'
    ) => {
        const file = e.target.files?.[0]
        if (file) {
            onFileSelect(file, type)
        }
        // Reset input to allow selecting the same file again
        e.target.value = ''
    }

    return (
        <div className="relative flex-shrink-0">
            {/* Paperclip button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                disabled={disabled || isRequestingMic}
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

            {/* Media menu popup */}
            <MediaMenu
                isOpen={isOpen && !isRecording && !isRequestingMic}
                onClose={() => onToggle()}
                onSelectImage={() => {
                    imageInputRef.current?.click()
                    onSelectImage()
                }}
                onSelectVideo={() => {
                    videoInputRef.current?.click()
                    onSelectVideo()
                }}
                onSelectDocument={() => {
                    documentInputRef.current?.click()
                    onSelectDocument()
                }}
                onStartRecording={onStartRecording}
            />

            {/* Hidden file inputs */}
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
    )
}
