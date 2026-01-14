import { type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * Input Area Component
 * 
 * Responsibility: Auto-resizing textarea with recording indicator
 * Layer: UI Component (View)
 * 
 * Props:
 * - value: Text content
 * - onChange: Content change callback
 * - onKeyDown: Keyboard event callback
 * - disabled: Input disabled state
 * - placeholder: Placeholder text
 * - isRecording: Recording in progress
 * - isRequestingMic: Requesting mic permission
 * - onStopRecording: Stop recording callback
 * - textareaRef: Ref for textarea element
 */

interface InputAreaProps {
    value: string
    onChange: (value: string) => void
    onCursorChange?: (position: number) => void
    onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
    disabled: boolean
    placeholder: string
    isRecording: boolean
    isRequestingMic: boolean
    onStopRecording: () => void
    textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export const InputArea = ({
    value,
    onChange,
    onCursorChange,
    onKeyDown,
    disabled,
    placeholder,
    isRecording,
    isRequestingMic,
    onStopRecording,
    textareaRef,
}: InputAreaProps) => {
    return (
        <div className="flex-1 relative">
            <textarea
                id="message-input"
                name="message-input"
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    // Capture cursor position immediately on change
                    onCursorChange?.(e.target.selectionStart || 0)
                }}
                onSelect={(e) => {
                    // Also update on selection changes (cursor movement)
                    const target = e.target as HTMLTextAreaElement
                    onCursorChange?.(target.selectionStart || 0)
                }}
                onKeyDown={onKeyDown}
                disabled={disabled}
                placeholder={isRecording ? 'Recording audio... (click paperclip to stop)' : placeholder}
                rows={1}
                autoComplete="off"
                className="w-full px-2 py-1.5 bg-transparent border-0 rounded-2xl text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto text-sm"
                style={{ minHeight: '40px', maxHeight: '100px' }}
                aria-label="Message input"
            />

            {/* Stop recording button */}
            {isRecording && (
                <motion.button
                    onClick={onStopRecording}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                    aria-label="Stop recording"
                >
                    Stop
                </motion.button>
            )}

            {/* Requesting mic loader */}
            {isRequestingMic && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-gray-500" />
                </div>
            )}
        </div>
    )
}
