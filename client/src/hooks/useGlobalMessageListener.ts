import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import type { DatabaseMessage } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Global message listener hook
 * 
 * Listens for ANY incoming message to the current user, regardless of which chat is open.
 * Handles the "Delivered" handshake by calling mark_messages_delivered RPC.
 * Also listens for status updates (delivered/seen) to update message checkmarks.
 * 
 * Should be used in DashboardLayout or App.tsx to ensure it runs globally.
 * 
 * PRODUCTION FIXES APPLIED:
 * - CRITICAL: Fixed filter syntax - Supabase realtime doesn't support or() filters
 * - HIGH #1: Handles optimistic message removal
 * - HIGH #2: Filters UPDATE subscription by user (in callback)
 * - HIGH #3: Handles both sent and received messages
 * - MEDIUM #1: Comprehensive error handling
 * - MEDIUM #2: Fixed memory leaks (removed function dependencies)
 * - LOW #1: Consistent logging levels
 */
export const useGlobalMessageListener = () => {
  const { user } = useAuthStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user?.id) {
      // Clean up if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch((err) => {
          logger.error('useGlobalMessageListener', 'Error removing channel on logout', err)
        })
        channelRef.current = null
      }
      return
    }

    const currentUserId = user.id

    // MEDIUM FIX #2: Get store actions inside effect to avoid dependency issues
    // This prevents unnecessary re-subscriptions when store functions change
    const { handleIncomingMessage, updateMessageStatus } = useChatStore.getState()

    // Helper function to process incoming messages
    const processNewMessage = (newMessage: DatabaseMessage) => {
      try {
        // Filter: Only process messages where current user is sender or receiver
        if (newMessage.sender_id !== currentUserId && newMessage.receiver_id !== currentUserId) {
          return // Not relevant to this user
        }

        logger.info('useGlobalMessageListener', 'New message received', {
          messageId: newMessage.id,
          senderId: newMessage.sender_id,
          receiverId: newMessage.receiver_id,
          isFromMe: newMessage.sender_id === currentUserId,
        })

        // 1. Handle incoming message (works for both sent and received)
        // This updates conversation list, reorders, and manages unread counts
        try {
          handleIncomingMessage(newMessage, currentUserId)
        } catch (err) {
          logger.error('useGlobalMessageListener', 'Error handling incoming message', err)
          // Don't throw - continue processing other parts
        }

        // 2. Add message to current chat if it's the active conversation
        const { selectedUser, messages } = useChatStore.getState()
        const isActiveConversation = selectedUser &&
          ((newMessage.sender_id === currentUserId && newMessage.receiver_id === selectedUser.id) ||
           (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUserId))
        
        if (isActiveConversation) {
          // HIGH FIX #1: Handle optimistic message removal
          // Remove optimistic message if it exists (same sender, receiver, content)
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
          const isDuplicate = withoutOptimistic.find((m) => m.id === newMessage.id)
          if (!isDuplicate) {
            useChatStore.setState({ messages: [...withoutOptimistic, newMessage] })
            logger.info('useGlobalMessageListener', 'Added message to active chat window', {
              messageId: newMessage.id,
              totalMessages: withoutOptimistic.length + 1,
              isFromMe: newMessage.sender_id === currentUserId,
            })
          } else {
            // Just remove optimistic message if real one already exists
            useChatStore.setState({ messages: withoutOptimistic })
            logger.debug('useGlobalMessageListener', 'Message already in chat, removed optimistic duplicate', {
              messageId: newMessage.id,
            })
          }
        } else {
          logger.debug('useGlobalMessageListener', 'Message not for active conversation (will appear in sidebar)', {
            messageId: newMessage.id,
            selectedUserId: selectedUser?.id || 'none',
            senderId: newMessage.sender_id,
            receiverId: newMessage.receiver_id,
          })
        }

        // 3. CRUCIAL: Only call mark_messages_delivered if we RECEIVED the message
        // This tells the sender "I got it" - the "Delivered" handshake
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

    // Helper function to process status updates
    const processStatusUpdate = (updatedMessage: DatabaseMessage, oldMessage: Partial<DatabaseMessage>) => {
      try {
        // Filter: Only process messages where current user is sender or receiver
        if (updatedMessage.sender_id !== currentUserId && updatedMessage.receiver_id !== currentUserId) {
          return // Not relevant to this user
        }

        // Only process if status changed
        if (updatedMessage.status && updatedMessage.status !== (oldMessage.status || undefined)) {
          logger.info('useGlobalMessageListener', 'Message status updated', {
            messageId: updatedMessage.id,
            oldStatus: oldMessage.status || undefined,
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

    // CRITICAL FIX: Supabase realtime doesn't support or() filter syntax
    // We need to use two separate subscriptions - one for received messages, one for sent messages
    // Or use no filter and filter in the callback (more reliable)
    const channel = supabase
      .channel(`global-messages-${currentUserId}`)
      // Subscribe to messages where current user is the RECEIVER
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          try {
            const newMessage = payload.new as DatabaseMessage
            logger.debug('useGlobalMessageListener', '📨 INSERT event received (receiver)', {
              messageId: newMessage.id,
            })
            processNewMessage(newMessage)
          } catch (err) {
            logger.error('useGlobalMessageListener', 'Error in receiver INSERT handler', err)
          }
        }
      )
      // Subscribe to messages where current user is the SENDER (for conversation list updates)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          try {
            const newMessage = payload.new as DatabaseMessage
            logger.debug('useGlobalMessageListener', '📤 INSERT event received (sender)', {
              messageId: newMessage.id,
            })
            processNewMessage(newMessage)
          } catch (err) {
            logger.error('useGlobalMessageListener', 'Error in sender INSERT handler', err)
          }
        }
      )
      // Subscribe to status updates for messages current user SENT (to see delivered/seen)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          try {
            const updatedMessage = payload.new as DatabaseMessage
            const oldMessage = payload.old as Partial<DatabaseMessage>
            logger.debug('useGlobalMessageListener', '🔄 UPDATE event received (sender)', {
              messageId: updatedMessage.id,
            })
            processStatusUpdate(updatedMessage, oldMessage)
          } catch (err) {
            logger.error('useGlobalMessageListener', 'Error in sender UPDATE handler', err)
          }
        }
      )
      // Subscribe to status updates for messages current user RECEIVED (in case needed)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          try {
            const updatedMessage = payload.new as DatabaseMessage
            const oldMessage = payload.old as Partial<DatabaseMessage>
            logger.debug('useGlobalMessageListener', '🔄 UPDATE event received (receiver)', {
              messageId: updatedMessage.id,
            })
            processStatusUpdate(updatedMessage, oldMessage)
          } catch (err) {
            logger.error('useGlobalMessageListener', 'Error in receiver UPDATE handler', err)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', '✅ Successfully subscribed to global messages channel', {
            userId: currentUserId,
            subscriptions: '4 (INSERT receiver, INSERT sender, UPDATE sender, UPDATE receiver)',
          })
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useGlobalMessageListener', '❌ Channel subscription error', { status })
        } else if (status === 'TIMED_OUT') {
          logger.warn('useGlobalMessageListener', '⏱️ Channel subscription timed out', { status })
        } else {
          logger.warn('useGlobalMessageListener', '⚠️ Unexpected subscription status', { status })
        }
      })

    channelRef.current = channel

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase
          .removeChannel(channelRef.current)
          .then(() => {
            logger.info('useGlobalMessageListener', 'Global messages channel removed')
          })
          .catch((err) => {
            logger.error('useGlobalMessageListener', 'Error removing global messages channel', err)
          })
        channelRef.current = null
      }
    }
    // MEDIUM FIX #2: Only depend on user.id to prevent unnecessary re-subscriptions
    // Store functions are accessed via getState() inside the effect
  }, [user?.id])
}
