import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export const MessageInput = ({ 
  onSend, 
  disabled = false,
  placeholder = 'Type a message...'
}: MessageInputProps) => {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 120 // Max height in pixels (about 5 lines)
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [content])

  const handleSend = () => {
    const trimmedContent = content.trim()
    if (trimmedContent && !disabled) {
      onSend(trimmedContent)
      setContent('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 z-chat-input flex-shrink-0 backdrop-blur-xl bg-white/80 border-t border-white/20 px-4 pt-4 safe-bottom"
    >
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl 
                     text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 
                     focus:ring-purple-500/50 focus:border-purple-500/50 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          className="p-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-full 
                   shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed 
                   transition-all flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={20} className={content.trim() ? 'opacity-100' : 'opacity-50'} />
        </motion.button>
      </div>
    </motion.div>
  )
}

