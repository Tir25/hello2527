import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { WelcomeScreen } from './WelcomeScreen'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

export const ChatWindow = () => {
  const { selectedUser, messages, loading, fetchMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, setSelectedUser } = useChatStore()
  const { user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Fetch messages when a user is selected
  useEffect(() => {
    if (selectedUser && user?.id) {
      logger.info('ChatWindow', `Fetching messages for conversation with ${selectedUser.id}`)
      
      // PRODUCTION FIX: Unsubscribe before fetching to prevent race conditions
      unsubscribeFromMessages()
      
      // Fetch messages
      fetchMessages(selectedUser.id, user.id)
      
      // PRODUCTION FIX: Subscribe to real-time updates
      // Note: Subscription properly handles duplicates, so no delay needed
      subscribeToMessages(user.id)
      
      // Cleanup subscription when component unmounts or user changes
      return () => {
        unsubscribeFromMessages()
      }
    } else {
      // Clear messages when no user is selected
      unsubscribeFromMessages()
      useChatStore.getState().setMessages([])
    }
    // PRODUCTION FIX: Zustand store functions are stable references, don't include in deps
    // Only track the actual values that should trigger re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id, user?.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  // Ensure messages stay scrolled to bottom on viewport resize (e.g., mobile keyboard)
  useEffect(() => {
    const handleResize = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!selectedUser || !user?.id) return

    const result = await sendMessage(content, selectedUser.id, user.id)
    if (!result.success) {
      logger.error('ChatWindow', 'Failed to send message', result.error)
      // PRODUCTION FIX: Show user-friendly error toast notification
      toast.error(result.error || 'Failed to send message. Please try again.')
    }
  }

  const handleBack = () => {
    setSelectedUser(null)
  }

  // Show welcome screen if no user is selected
  if (!selectedUser) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-full overflow-hidden">
      {/* Chat Header */}
      <ChatHeader 
        selectedUser={selectedUser} 
        onBack={handleBack}
        showBackButton={true}
      />

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-2 py-4 pb-28 md:pb-4 messages-scroll"
        style={{
          scrollBehavior: 'smooth',
        }}
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
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                />
              )
            })}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput 
        onSend={handleSendMessage}
        disabled={loading}
      />
    </div>
  )
}

