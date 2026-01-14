/**
 * Global Message Listener Hook
 * 
 * Responsibility: Subscribe to Supabase Realtime channels for message events
 * Layer: Hook (Side Effect Management)
 * 
 * Listens for ANY incoming message to the current user, regardless of which chat is open.
 * Handlers are extracted into separate files for modularity:
 * - handleNewMessage.ts: INSERT events
 * - handleMessageUpdate.ts: UPDATE events  
 * - handleGroupMessage.ts: Group INSERT events with client-side filtering
 * 
 * Performance Optimizations:
 * - Prevents channel churn by tracking subscription state
 * - Only recreates channels when user ID actually changes
 * - Debounced channel cleanup to batch rapid auth state changes
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  createNewMessageHandler,
  createMessageUpdateHandler,
  createGroupMessageHandler,
} from './chat/handlers'

export const useGlobalMessageListener = () => {
  const { user } = useAuthStore()
  const receiverInsertChannelRef = useRef<RealtimeChannel | null>(null)
  const receiverUpdateChannelRef = useRef<RealtimeChannel | null>(null)
  const senderInsertChannelRef = useRef<RealtimeChannel | null>(null)
  const senderUpdateChannelRef = useRef<RealtimeChannel | null>(null)
  const groupInsertChannelRef = useRef<RealtimeChannel | null>(null)
  const subscribedUserIdRef = useRef<string | null>(null)
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const currentUserId = user?.id

    // Early exit if user ID hasn't changed (prevents channel churn)
    if (currentUserId === subscribedUserIdRef.current) {
      return
    }

    // Clean up existing channels if user changed or logged out
    if (subscribedUserIdRef.current !== null) {
      const channelRefs = [
        receiverInsertChannelRef,
        receiverUpdateChannelRef,
        senderInsertChannelRef,
        senderUpdateChannelRef,
        groupInsertChannelRef,
      ]

      // Debounce cleanup to batch rapid auth state changes
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }

      cleanupTimeoutRef.current = setTimeout(() => {
        channelRefs.forEach((ref) => {
          if (ref.current) {
            supabase.removeChannel(ref.current).catch((err) => {
              logger.error('useGlobalMessageListener', 'Error removing channel', err)
            })
            ref.current = null
          }
        })
        cleanupTimeoutRef.current = null
      }, 100)
    }

    if (!currentUserId) {
      subscribedUserIdRef.current = null
      return
    }

    subscribedUserIdRef.current = currentUserId

    // Create handlers with current user context
    const handleNewMessage = createNewMessageHandler(currentUserId)
    const handleMessageUpdate = createMessageUpdateHandler(currentUserId)
    const handleGroupMessage = createGroupMessageHandler(currentUserId)

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
          logger.warn('useGlobalMessageListener', 'Receiver INSERT channel error (will retry)')
        } else if (status === 'TIMED_OUT') {
          logger.error('useGlobalMessageListener', 'Receiver INSERT channel timed out')
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
        handleMessageUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to receiver UPDATE channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('useGlobalMessageListener', 'Receiver UPDATE channel error (will retry)')
        } else if (status === 'TIMED_OUT') {
          logger.error('useGlobalMessageListener', 'Receiver UPDATE channel timed out')
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
          logger.warn('useGlobalMessageListener', 'Sender INSERT channel error (will retry)')
        } else if (status === 'TIMED_OUT') {
          logger.error('useGlobalMessageListener', 'Sender INSERT channel timed out')
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
        handleMessageUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to sender UPDATE channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('useGlobalMessageListener', 'Sender UPDATE channel error (will retry)')
        } else if (status === 'TIMED_OUT') {
          logger.error('useGlobalMessageListener', 'Sender UPDATE channel timed out')
        }
      })

    // Channel 5: INSERT events for GROUP messages (client-side filtering)
    const groupInsertChannel = supabase
      .channel(`msg-group-insert-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // NO FILTER - we filter client-side in handleGroupMessage
        },
        handleGroupMessage
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useGlobalMessageListener', 'Subscribed to group INSERT channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('useGlobalMessageListener', 'Group INSERT channel error (will retry)')
        } else if (status === 'TIMED_OUT') {
          logger.error('useGlobalMessageListener', 'Group INSERT channel timed out')
        }
      })

    // Store channel references
    receiverInsertChannelRef.current = receiverInsertChannel
    receiverUpdateChannelRef.current = receiverUpdateChannel
    senderInsertChannelRef.current = senderInsertChannel
    senderUpdateChannelRef.current = senderUpdateChannel
    groupInsertChannelRef.current = groupInsertChannel

    // Cleanup function
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
        cleanupTimeoutRef.current = null
      }

      const channels = [
        { ref: receiverInsertChannelRef, name: 'receiver INSERT' },
        { ref: receiverUpdateChannelRef, name: 'receiver UPDATE' },
        { ref: senderInsertChannelRef, name: 'sender INSERT' },
        { ref: senderUpdateChannelRef, name: 'sender UPDATE' },
        { ref: groupInsertChannelRef, name: 'group INSERT' },
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

      subscribedUserIdRef.current = null
    }
  }, [user?.id])
}
