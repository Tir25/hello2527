import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'

/**
 * Send Button Component
 * 
 * Responsibility: Gradient send button with loading state
 * Layer: UI Component (View)
 * 
 * Props:
 * - onClick: Send message callback
 * - disabled: Button disabled state
 * - canSend: Whether message can be sent
 * - isUploading: Upload in progress
 */

interface SendButtonProps {
    onClick: () => void
    disabled: boolean
    canSend: boolean
    isUploading: boolean
}

export const SendButton = ({
    onClick,
    disabled,
    canSend,
    isUploading,
}: SendButtonProps) => {
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={(e) => {
                // Prevent focus from leaving the textarea (keeps keyboard open on mobile)
                e.preventDefault()
            }}
            onClick={onClick}
            disabled={disabled || !canSend || isUploading}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            aria-label="Send message"
        >
            {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : (
                <Send size={20} className={canSend ? 'opacity-100' : 'opacity-50'} />
            )}
        </motion.button>
    )
}
