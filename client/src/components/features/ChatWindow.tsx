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
import { supabase } from '@/lib/supabase'

type ScrollBehaviorType = 'auto' | 'smooth'

export const ChatWindow = () => {
  const {
    selectedUser,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    // CRITICAL FIX: Removed subscribeToMessages and unsubscribeFromMessages
    // Global listener (useGlobalMessageListener) handles all message INSERTs
    setSelectedUser,
    isUserTyping,
  } = useChat()
  const { user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const processedMessageIdsRef = useRef<Set<string>>(new Set())
  const markSeenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const NEAR_BOTTOM_THRESHOLD_PX = 160

  const scrollToBottom = (behavior: ScrollBehaviorType = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }

  useEffect(() => {
    if (selectedUser && user?.id) {
      logger.info('ChatWindow', `Fetching messages for conversation with ${selectedUser.id}`)
      // CRITICAL FIX: Removed subscription calls
      // Global listener (useGlobalMessageListener) handles all message INSERTs
      // chatStore.subscribeToMessages() handles status UPDATEs (called automatically)
      fetchMessages(selectedUser.id, user.id)
    } else {
      useChatStore.getState().setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id, user?.id])

  // Mark new messages as "Seen" when they arrive while chat is already open
  // CRITICAL FIX #1 & #3: Single source of truth with proper dependency tracking
  useEffect(() => {
    if (!selectedUser || !user?.id) {
      // Reset processed messages when chat closes
      processedMessageIdsRef.current.clear()
      return
    }

    // Find unseen messages from selectedUser that haven't been processed
    const unseenMessages = messages.filter(
      (msg) => 
        msg.sender_id === selectedUser.id && 
        msg.status !== 'seen' &&
        !processedMessageIdsRef.current.has(msg.id)
    )

    if (unseenMessages.length === 0) return

    // Mark these message IDs as processed immediately to prevent duplicate calls
    unseenMessages.forEach(msg => processedMessageIdsRef.current.add(msg.id))

    // Debounce to batch rapid message arrivals (300ms)
    if (markSeenTimeoutRef.current) {
      clearTimeout(markSeenTimeoutRef.current)
    }

    markSeenTimeoutRef.current = setTimeout(() => {
      // Mark messages as seen
      Promise.resolve(
        supabase.rpc('mark_messages_seen', {
          sender_id_param: selectedUser.id,
          receiver_id_param: user.id,
        })
      )
        .then(({ data, error }) => {
          if (error) {
            logger.error('ChatWindow:markSeen', 'Failed to mark messages as seen', error)
            // Remove from processed set on error so we can retry
            unseenMessages.forEach(msg => processedMessageIdsRef.current.delete(msg.id))
          } else {
            // LOW FIX #3: Log count instead of full array
            const count = data?.length || 0
            logger.debug('ChatWindow:markSeen', `Marked ${count} messages as seen`)
            // Clear unread count for this conversation
            useChatStore.getState().clearUnreadCount(selectedUser.id)
          }
        })
        .catch((err: unknown) => {
          logger.error('ChatWindow:markSeen', 'Unexpected error marking messages as seen', err)
          // Remove from processed set on error so we can retry
          unseenMessages.forEach(msg => processedMessageIdsRef.current.delete(msg.id))
        })
    }, 300)

    // LOW FIX #1: Cleanup timeout on unmount or dependency change
    return () => {
      if (markSeenTimeoutRef.current) {
        clearTimeout(markSeenTimeoutRef.current)
        markSeenTimeoutRef.current = null
      }
    }
    // CRITICAL FIX #3: Using messages.length instead of messages array to prevent infinite loops
    // Using selectedUser?.id instead of selectedUser to prevent unnecessary re-renders
    // The ref-based tracking (processedMessageIdsRef) ensures we don't process the same message twice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id, user?.id, messages.length])

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
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id
              const isLastMessage = index === messages.length - 1
              return (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwn={isOwn}
                  recipientProfile={selectedUser}
                  isLastMessage={isLastMessage}
                />
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

