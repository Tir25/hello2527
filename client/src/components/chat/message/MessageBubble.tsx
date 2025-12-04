import { motion } from 'framer-motion'
import type { DatabaseMessage } from '@/types'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'
import { MessageContent } from './MessageContent'
import { MessageStatus } from './MessageStatus'
import { MessageTimestamp } from './MessageTimestamp'
import type { Profile } from '@/lib/services/profile.service'

interface MessageBubbleProps {
  message: DatabaseMessage
  isOwn: boolean
  recipientProfile?: Profile | null
  isLastMessage?: boolean
}

/**
 * Container component for message bubbles
 * Handles layout, alignment, and delegates content rendering to MessageContent
 */
export const MessageBubble = ({
  message,
  isOwn,
  recipientProfile,
  isLastMessage = false,
}: MessageBubbleProps) => {
  const hasMedia = message.media_url && message.media_type
  const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER

  // Validate status with fallback
  const getValidStatus = (): 'sent' | 'delivered' | 'seen' => {
    return (message.status && ['sent', 'delivered', 'seen'].includes(message.status) ? message.status : 'sent') as
      | 'sent'
      | 'delivered'
      | 'seen'
  }

  // Footer is hidden for media-only messages where time is inline
  // Also hidden for audio messages (audio always shows time inside its row)
  const showFooter = !(hasMedia && (!hasTextContent || message.media_type === 'audio'))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}
    >
      <div
        className={`max-w-[70%] sm:max-w-[75%] md:max-w-[60%] ${
          isOwn
            ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-2xl rounded-tr-md'
            : 'bg-white/30 backdrop-blur-sm text-gray-900 rounded-2xl rounded-tl-md'
        } ${hasMedia && !hasTextContent ? 'p-1.5' : 'px-4 py-2.5'} shadow-lg border border-white/20`}
      >
        <MessageContent
          message={message}
          isOwn={isOwn}
          recipientProfile={recipientProfile}
          isLastMessage={isLastMessage}
        />

        {showFooter && (
          <div
            className={`flex items-center justify-end gap-1 mt-1.5 ${
              isOwn ? 'text-white/80' : 'text-gray-500'
            }`}
          >
            <MessageTimestamp timestamp={message.created_at} size="xs" />
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
      </div>
    </motion.div>
  )
}

