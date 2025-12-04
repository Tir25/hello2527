import { useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { DatabaseMessage } from '@/types'
import { MessageBubble } from '@/components/chat/message/MessageBubble'
import type { Profile } from '@/lib/services/profile.service'

interface MessageListProps {
  messages: DatabaseMessage[]
  currentUserId: string | undefined
  selectedUser: Profile | null
  loading: boolean
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

type ScrollBehaviorType = 'auto' | 'smooth'

/**
 * Presenter component for rendering the scrollable message list
 * Handles scrolling logic and empty states
 */
export const MessageList = ({
  messages,
  currentUserId,
  selectedUser,
  loading,
  messagesContainerRef,
  messagesEndRef,
}: MessageListProps) => {
  const scrollToBottom = useCallback((behavior: ScrollBehaviorType = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }, [messagesEndRef])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, scrollToBottom])

  // Handle viewport changes (keyboard, resize)
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const NEAR_BOTTOM_THRESHOLD_PX = 160

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
  }, [messagesContainerRef, scrollToBottom])

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div>
      {messages.map((message, index) => {
        const isOwn = message.sender_id === currentUserId
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
  )
}

