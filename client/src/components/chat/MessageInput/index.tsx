import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessageInput } from '@/hooks/chat/useMessageInput'
import { FilePreview } from './FilePreview'
import { InputArea } from './InputArea'
import { AttachButton } from './AttachButton'
import { SendButton } from './SendButton'

/**
 * Message Input Container Component
 * 
 * Responsibility: Main container that connects useMessageInput hook to UI
 * Layer: UI Component (View)
 * 
 * Props:
 * - onSend: Callback to send message
 * - disabled: Input disabled state
 * - placeholder: Placeholder text
 * - receiverId: ID of message receiver
 * 
 * Rules:
 * - NO useEffect
 * - NO service calls
 * - NO complex state calculations
 * - ONLY renders JSX and passes props
 */

interface MessageInputProps {
    onSend: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document') => void
    disabled?: boolean
    placeholder?: string
    receiverId?: string
}

export const MessageInput = ({
    onSend,
    disabled = false,
    placeholder = 'Type a message...',
    receiverId,
}: MessageInputProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const {
        content,
        setContent,
        textareaRef,
        handleSend,
        handleKeyDown,
        canSend,
        filePreview,
        isUploading,
        uploadError,
        handleFileSelect,
        removePreview,
        retryUpload,
        isRecording,
        isRequestingMic,
        startRecording,
        stopRecording,
        handleTyping,
    } = useMessageInput({ onSend, disabled, receiverId })

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-chat-input flex-shrink-0 backdrop-blur-xl bg-white/70 border-t border-white/10 px-2 pt-1 pb-safe safe-bottom mb-1 md:mb-1"
        >
            <div className="flex flex-col gap-2 max-w-3xl mx-auto">
                {/* File Preview */}
                <AnimatePresence>
                    {filePreview && (
                        <FilePreview
                            filePreview={filePreview}
                            isUploading={isUploading}
                            uploadError={uploadError}
                            onRemove={removePreview}
                            onRetry={retryUpload}
                        />
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="flex items-end">
                    {/* Input shell with pill-shaped edges */}
                    <div className="flex items-end gap-1.5 flex-1 bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl px-2.5 py-1.5 shadow-md">
                        {/* Attach Button */}
                        <AttachButton
                            isOpen={isMenuOpen}
                            onToggle={() => setIsMenuOpen(!isMenuOpen)}
                            disabled={disabled || isUploading}
                            isRecording={isRecording}
                            isRequestingMic={isRequestingMic}
                            onSelectImage={() => setIsMenuOpen(false)}
                            onSelectVideo={() => setIsMenuOpen(false)}
                            onSelectDocument={() => setIsMenuOpen(false)}
                            onStartRecording={() => {
                                startRecording()
                                setIsMenuOpen(false)
                            }}
                            onFileSelect={handleFileSelect}
                        />

                        {/* Text Input */}
                        <InputArea
                            value={content}
                            onChange={(value) => {
                                setContent(value)
                                handleTyping()
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={disabled || isUploading}
                            placeholder={placeholder}
                            isRecording={isRecording}
                            isRequestingMic={isRequestingMic}
                            onStopRecording={stopRecording}
                            textareaRef={textareaRef}
                        />

                        {/* Send Button */}
                        <SendButton
                            onClick={handleSend}
                            disabled={disabled}
                            canSend={canSend}
                            isUploading={isUploading}
                        />
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
