import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { WelcomeScreen } from './WelcomeScreen'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

type ScrollBehaviorType = 'auto' | 'smooth'

export const ChatWindow = () => {
  const {
    selectedUser,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    setSelectedUser,
    isUserTyping,
  } = useChat()
  const { user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const NEAR_BOTTOM_THRESHOLD_PX = 160

  const scrollToBottom = (behavior: ScrollBehaviorType = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }

  useEffect(() => {
    if (selectedUser && user?.id) {
      logger.info('ChatWindow', `Fetching messages for conversation with ${selectedUser.id}`)
      unsubscribeFromMessages()
      fetchMessages(selectedUser.id, user.id)
      subscribeToMessages(user.id)
      return () => {
        unsubscribeFromMessages()
      }
    } else {
      unsubscribeFromMessages()
      useChatStore.getState().setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id, user?.id])

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const isNearBottom = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight
      return distanceFromBottom <= NEAR_BOTTOM_THRESHOLD_PX
    }

    const handleViewportChange = () => {
      if (!isNearBottom()) return
      scrollToBottom('smooth')
    }

    const visualViewport = window.visualViewport
    visualViewport?.addEventListener('resize', handleViewportChange)
    visualViewport?.addEventListener('scroll', handleViewportChange)

    const handleWindowResize = () => {
      if (!isNearBottom()) return
      scrollToBottom('smooth')
    }

    window.addEventListener('resize', handleWindowResize)

    return () => {
      visualViewport?.removeEventListener('resize', handleViewportChange)
      visualViewport?.removeEventListener('scroll', handleViewportChange)
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

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
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
            </motion.div>
          </div>
        ) : (
          <div>
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id
              return (
                <MessageBubble key={message.id} message={message} isOwn={isOwn} />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
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
              <span className="font-medium">{selectedUser.full_name || selectedUser.email || 'User'}</span>
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

      {/* Input - bottom fixed flex item, not sticky */}
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

