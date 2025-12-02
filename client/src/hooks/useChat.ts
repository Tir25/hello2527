import { useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { chatService } from '@/lib/services/chat.service'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { DatabaseMessage } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'

export const useChat = () => {
  const {
    selectedUser,
    messages,
    loading,
    setMessages,
    addMessage,
    setSelectedUser,
    messagesLoading,
  } = useChatStore()

  const fetchMessages = useCallback(
    async (receiverId: string, currentUserId: string) => {
      try {
        useChatStore.setState({ messagesLoading: true, messagesError: null, loading: true, error: null })

        const result = await chatService.fetchMessages(currentUserId, receiverId)

        if (!result.success) {
          logger.error('useChat:fetchMessages', 'Failed to fetch messages', result.error)
          useChatStore.setState({
            messagesLoading: false,
            messagesError: result.error || 'Failed to fetch messages',
            loading: false,
            error: result.error || 'Failed to fetch messages',
          })
          toast.error('Unable to load messages. Please try again.')
          return
        }

        setMessages(result.data || [])
        useChatStore.setState({ messagesLoading: false, loading: false })
      } catch (err) {
        logger.error('useChat:fetchMessages', 'Unexpected error', err)
        useChatStore.setState({
          messagesLoading: false,
          messagesError: 'An unexpected error occurred',
          loading: false,
          error: 'An unexpected error occurred',
        })
      }
    },
    [setMessages]
  )

  const sendMessage = useCallback(
    async (
      content: string,
      receiverId: string,
      currentUserId: string,
      mediaUrl?: string,
      mediaType?: 'image' | 'video' | 'audio' | 'document'
    ) => {
      try {
        const optimisticMessage: DatabaseMessage = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: content.trim() || (mediaUrl ? MEDIA_PLACEHOLDER : ''),
          created_at: new Date().toISOString(),
          is_read: false,
          media_url: mediaUrl,
          media_type: mediaType,
        }

        addMessage(optimisticMessage)

        const result = await chatService.sendMessage(
          content,
          currentUserId,
          receiverId,
          mediaUrl,
          mediaType
        )

        if (!result.success) {
          const { messages: currentMessages } = useChatStore.getState()
          useChatStore.setState({
            messages: currentMessages.filter((m) => m.id !== optimisticMessage.id),
            error: result.error || 'Failed to send message',
          })
          logger.error('useChat:sendMessage', 'Failed to send message', result.error)
          toast.error(result.error || 'Failed to send message. Please try again.')
          return { success: false, error: result.error }
        }

        logger.info('useChat:sendMessage', 'Message sent successfully')
        return { success: true }
      } catch (err) {
        logger.error('useChat:sendMessage', 'Unexpected error', err)
        const { messages: currentMessages } = useChatStore.getState()
        useChatStore.setState({
          messages: currentMessages.filter((m) => !m.id.startsWith('temp-')),
          error: 'An unexpected error occurred',
        })
        return { success: false, error: 'An unexpected error occurred' }
      }
    },
    [addMessage]
  )

  const subscribeToMessages = useCallback((currentUserId: string) => {
    const { channel } = useChatStore.getState()
    if (channel) {
      supabase.removeChannel(channel)
    }

    const newChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as DatabaseMessage
          const { selectedUser: currentSelectedUser, messages: currentMessages } =
            useChatStore.getState()

          if (
            currentSelectedUser &&
            ((newMessage.sender_id === currentUserId &&
              newMessage.receiver_id === currentSelectedUser.id) ||
              (newMessage.sender_id === currentSelectedUser.id &&
                newMessage.receiver_id === currentUserId))
          ) {
            const withoutOptimistic = currentMessages.filter(
              (m) =>
                !(
                  m.id.startsWith('temp-') &&
                  m.sender_id === newMessage.sender_id &&
                  m.receiver_id === newMessage.receiver_id &&
                  m.content === newMessage.content
                )
            )

            if (!withoutOptimistic.find((m) => m.id === newMessage.id)) {
              logger.info('useChat:subscribeToMessages', 'New message received')
              useChatStore.setState({ messages: [...withoutOptimistic, newMessage] })
            } else {
              useChatStore.setState({ messages: withoutOptimistic })
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useChat:subscribeToMessages', 'Successfully subscribed')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useChat:subscribeToMessages', 'Channel subscription error')
          useChatStore.setState({ error: 'Failed to subscribe to real-time updates' })
        }
      })

    useChatStore.setState({ channel: newChannel as RealtimeChannel })
  }, [])

  const unsubscribeFromMessages = useCallback(() => {
    const { channel } = useChatStore.getState()
    if (channel) {
      supabase
        .removeChannel(channel)
        .then(() => {
          logger.info('useChat:unsubscribeFromMessages', 'Channel removed successfully')
        })
        .catch((err) => {
          logger.error('useChat:unsubscribeFromMessages', 'Error removing channel', err)
        })
        .finally(() => {
          useChatStore.setState({ channel: null })
        })
    }
  }, [])

  return {
    selectedUser,
    messages,
    loading: loading || messagesLoading,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    setSelectedUser,
  }
}

