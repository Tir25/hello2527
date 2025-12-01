import { motion } from 'framer-motion'
import { format } from 'date-fns'
import type { DatabaseMessage } from '@/types'

interface MessageBubbleProps {
  message: DatabaseMessage
  isOwn: boolean
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const timestamp = new Date(message.created_at)
  const formattedTime = format(timestamp, 'h:mm a')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}
    >
      <div
        className={`max-w-[70%] md:max-w-[60%] ${
          isOwn
            ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-2xl rounded-tr-md'
            : 'bg-white/30 backdrop-blur-sm text-gray-900 rounded-2xl rounded-tl-md'
        } px-4 py-2.5 shadow-lg border border-white/20`}
      >
        {/* Message Content */}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </p>

        {/* Timestamp */}
        <div className={`flex items-center justify-end gap-1 mt-1.5 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
          <span className="text-xs">{formattedTime}</span>
          {isOwn && message.is_read && (
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-label="Read"
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
  )
}

