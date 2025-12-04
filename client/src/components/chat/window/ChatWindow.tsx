import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { WelcomeScreen } from '@/components/features/WelcomeScreen'
import { ChatHeader } from '@/components/features/ChatHeader'
import { MessageInput } from '@/components/features/MessageInput'
import { MessageList } from './MessageList'
import { useMarkMessagesSeen } from '@/hooks/useMessageStatus'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

/**
 * Container component for the chat window
 * Handles layout, state management, and delegates rendering to presenter components
 */
export const ChatWindow = () => {
  const {
    selectedUser,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    setSelectedUser,
    isUserTyping,
  } = useChat()
  const { user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-mark messages as seen when chat is open
  useMarkMessagesSeen(selectedUser?.id || null)

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser && user?.id) {
      logger.info('ChatWindow', `Fetching messages for conversation with ${selectedUser.id}`)
      fetchMessages(selectedUser.id, user.id)
    } else {
      useChatStore.getState().setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id, user?.id])

  const handleSendMessage = async (
    content: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'audio' | 'document'
  ) => {
    if (!selectedUser || !user?.id) return

    const result = await sendMessage(content, selectedUser.id, user.id, mediaUrl, mediaType)
    if (!result.success) {
      logger.error('ChatWindow', 'Failed to send message', result.error)
      toast.error(result.error || 'Failed to send message. Please try again.')
    }
  }

  const handleBack = () => {
    setSelectedUser(null)
  }

  if (!selectedUser) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - fixed height */}
      <div className="flex-none">
        <ChatHeader selectedUser={selectedUser} onBack={handleBack} showBackButton={true} />
      </div>

      {/* Message list - only scrollable area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-none px-2 pt-4 pb-1 messages-scroll"
        style={{ scrollBehavior: 'smooth' }}
      >
        <MessageList
          messages={messages}
          currentUserId={user?.id}
          selectedUser={selectedUser}
          loading={loading}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {selectedUser && isUserTyping(selectedUser.id) && (
          <div className="flex-none px-4 py-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <span className="font-medium">
                {selectedUser.full_name || selectedUser.email || 'User'}
              </span>
              <span>is typing</span>
              <div className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Input - bottom fixed flex item */}
      <div className="flex-none">
        <MessageInput
          onSend={handleSendMessage}
          disabled={loading}
          receiverId={selectedUser.id}
        />
      </div>
    </div>
  )
}

