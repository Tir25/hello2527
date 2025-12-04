import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import type { DatabaseMessage } from '@/types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Global message listener hook
 * 
 * Listens for ANY incoming message to the current user, regardless of which chat is open.
 * Handles the "Delivered" handshake by calling mark_messages_delivered RPC.
 * Also listens for status updates (delivered/seen) to update message checkmarks.
 * 
 * Should be used in DashboardLayout or App.tsx to ensure it runs globally.
 * 
 * CRITICAL FIX: Supabase Realtime doesn't support complex `or()` filter syntax.
 * We now use separate subscriptions for sent and received messages.
 */
export const useGlobalMessageListener = () => {
  const { user } = useAuthStore()
  const receiverInsertChannelRef = useRef<RealtimeChannel | null>(null)
  const receiverUpdateChannelRef = useRef<RealtimeChannel | null>(null)
  const senderInsertChannelRef = useRef<RealtimeChannel | null>(null)
  const senderUpdateChannelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user?.id) {
      // Clean up all channels if user logs out
      const channels = [
        receiverInsertChannelRef,
        receiverUpdateChannelRef,
        senderInsertChannelRef,
        senderUpdateChannelRef,
      ]
      channels.forEach((ref) => {
        if (ref.current) {
          supabase.removeChannel(ref.current).catch((err) => {
            logger.error('useGlobalMessageListener', 'Error removing channel on logout', err)
          })
          ref.current = null
        }
      })
      return
    }

    const currentUserId = user.id

    // Get store actions inside effect to avoid dependency issues
    const { handleIncomingMessage, updateMessageStatus } = useChatStore.getState()

    /**
     * Handler for new messages (INSERT events)
     */
    const handleNewMessage = (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
      try {
        const newMessage = payload.new as DatabaseMessage
        
        logger.info('useGlobalMessageListener', 'New message received', {
          messageId: newMessage.id,
          senderId: newMessage.sender_id,
          receiverId: newMessage.receiver_id,
        })

        // 1. Handle incoming message - updates conversation list, reorders, manages unread counts
        try {
          handleIncomingMessage(newMessage, currentUserId)
        } catch (err) {
          logger.error('useGlobalMessageListener', 'Error handling incoming message', err)
        }

        // 2. Add message to current chat if it's the active conversation
        const { selectedUser, messages } = useChatStore.getState()
        if (
          selectedUser &&
          ((newMessage.sender_id === currentUserId && newMessage.receiver_id === selectedUser.id) ||
           (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUserId))
        ) {
          // Handle optimistic message removal
          const withoutOptimistic = messages.filter(
            (m) =>
              !(
                m.id.startsWith('temp-') &&
                m.sender_id === newMessage.sender_id &&
                m.receiver_id === newMessage.receiver_id &&
                m.content === newMessage.content
              )
          )

          // Only add if not duplicate
          if (!withoutOptimistic.find((m) => m.id === newMessage.id)) {
            useChatStore.setState({ messages: [...withoutOptimistic, newMessage] })
            logger.debug('useGlobalMessageListener', 'Added message to active chat', {
              messageId: newMessage.id,
            })
          } else {
            // Just remove optimistic message if real one already exists
            useChatStore.setState({ messages: withoutOptimistic })
          }
        }

        // 3. Mark messages as delivered if we RECEIVED the message
        if (newMessage.receiver_id === currentUserId) {
          Promise.resolve(
            supabase.rpc('mark_messages_delivered', { user_id: currentUserId })
          )
            .then(({ data, error }) => {
              if (error) {
                logger.error('useGlobalMessageListener', 'Failed to mark messages as delivered', error)
              } else {
                const count = data?.length || 0
                logger.info('useGlobalMessageListener', `Marked ${count} messages as delivered`)
              }
            })
            .catch((err: unknown) => {
              logger.error('useGlobalMessageListener', 'Unexpected error marking messages as delivered', err)
            })
        }
      } catch (err) {
        logger.error('useGlobalMessageListener', 'Unexpected error processing new message', err)
      }
    }

    /**
     * Handler for status updates (UPDATE events)
     */
    const handleStatusUpdate = (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
      try {
        const updatedMessage = payload.new as DatabaseMessage
        const oldMessage = payload.old as Partial<DatabaseMessage>

        // Only process if status changed
        if (updatedMessage.status !== oldMessage.status) {
          logger.info('useGlobalMessageListener', 'Message status updated', {
            messageId: updatedMessage.id,
            oldStatus: oldMessage.status,
            newStatus: updatedMessage.status,
          })

          // Update the message status in the store
          try {
            updateMessageStatus(
              updatedMessage.id,
              updatedMessage.status,
              updatedMessage.delivered_at,
              updatedMessage.seen_at
            )
          } catch (err) {
            logger.error('useGlobalMessageListener', 'Error updating message status in store', err)
          }
        }
      } catch (err) {
        logger.error('useGlobalMessageListener', 'Unexpected error processing status update', err)
      }
    }

    // CRITICAL FIX: Supabase Realtime doesn't support complex `or()` filter syntax
    // We create FOUR separate channels to avoid TypeScript chaining issues

    // Channel 1: INSERT events for received messages
    const receiverInsertChannel = supabase
      .channel(`msg-recv-insert-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        handleNewMessage
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to receiver INSERT channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useGlobalMessageListener', 'Receiver INSERT channel error')
        }
      })

    // Channel 2: UPDATE events for received messages
    const receiverUpdateChannel = supabase
      .channel(`msg-recv-update-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        handleStatusUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to receiver UPDATE channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useGlobalMessageListener', 'Receiver UPDATE channel error')
        }
      })

    // Channel 3: INSERT events for sent messages (to replace optimistic messages)
    const senderInsertChannel = supabase
      .channel(`msg-send-insert-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        handleNewMessage
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to sender INSERT channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useGlobalMessageListener', 'Sender INSERT channel error')
        }
      })

    // Channel 4: UPDATE events for sent messages (to see delivered/seen status)
    const senderUpdateChannel = supabase
      .channel(`msg-send-update-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        handleStatusUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to sender UPDATE channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useGlobalMessageListener', 'Sender UPDATE channel error')
        }
      })

    receiverInsertChannelRef.current = receiverInsertChannel
    receiverUpdateChannelRef.current = receiverUpdateChannel
    senderInsertChannelRef.current = senderInsertChannel
    senderUpdateChannelRef.current = senderUpdateChannel

    // Cleanup function
    return () => {
      const channels = [
        { ref: receiverInsertChannelRef, name: 'receiver INSERT' },
        { ref: receiverUpdateChannelRef, name: 'receiver UPDATE' },
        { ref: senderInsertChannelRef, name: 'sender INSERT' },
        { ref: senderUpdateChannelRef, name: 'sender UPDATE' },
      ]

      channels.forEach(({ ref, name }) => {
        if (ref.current) {
          supabase
            .removeChannel(ref.current)
            .then(() => {
              logger.debug('useGlobalMessageListener', `${name} channel removed`)
            })
            .catch((err) => {
              logger.error('useGlobalMessageListener', `Error removing ${name} channel`, err)
            })
          ref.current = null
        }
      })
    }
  }, [user?.id])
}
