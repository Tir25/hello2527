import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'

/**
 * Hook to automatically mark messages as "seen" when chat is open
 * 
 * This hook handles the "Seen" status logic by:
 * 1. Tracking which messages have already been processed
 * 2. Debouncing RPC calls to batch rapid message arrivals
 * 3. Clearing unread counts when messages are marked as seen
 * 
 * @param selectedUserId - The ID of the user in the currently open chat
 */
export const useMarkMessagesSeen = (selectedUserId: string | null) => {
  const { user } = useAuthStore()
  const { messages } = useChatStore()
  const processedMessageIdsRef = useRef<Set<string>>(new Set())
  const markSeenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!selectedUserId || !user?.id) {
      // Reset processed messages when chat closes
      processedMessageIdsRef.current.clear()
      return
    }

    // Find unseen messages from selectedUser that haven't been processed
    const unseenMessages = messages.filter(
      (msg) =>
        msg.sender_id === selectedUserId &&
        msg.status !== 'seen' &&
        !processedMessageIdsRef.current.has(msg.id)
    )

    if (unseenMessages.length === 0) return

    // Mark these message IDs as processed immediately to prevent duplicate calls
    unseenMessages.forEach((msg) => processedMessageIdsRef.current.add(msg.id))

    // Debounce to batch rapid message arrivals (300ms)
    if (markSeenTimeoutRef.current) {
      clearTimeout(markSeenTimeoutRef.current)
    }

    markSeenTimeoutRef.current = setTimeout(() => {
      // Mark messages as seen
      Promise.resolve(
        supabase.rpc('mark_messages_seen', {
          sender_id_param: selectedUserId,
          receiver_id_param: user.id,
        })
      )
        .then(({ data, error }) => {
          if (error) {
            logger.error('useMessageStatus', 'Failed to mark messages as seen', error)
            // Remove from processed set on error so we can retry
            unseenMessages.forEach((msg) => processedMessageIdsRef.current.delete(msg.id))
          } else {
            const count = data?.length || 0
            logger.debug('useMessageStatus', `Marked ${count} messages as seen`)
            // Clear unread count for this conversation
            useChatStore.getState().clearUnreadCount(selectedUserId)
          }
        })
        .catch((err: unknown) => {
          logger.error('useMessageStatus', 'Unexpected error marking messages as seen', err)
          // Remove from processed set on error so we can retry
          unseenMessages.forEach((msg) => processedMessageIdsRef.current.delete(msg.id))
        })
    }, 300)

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (markSeenTimeoutRef.current) {
        clearTimeout(markSeenTimeoutRef.current)
        markSeenTimeoutRef.current = null
      }
    }
    // Using messages.length instead of messages array to prevent infinite loops
    // Using selectedUserId instead of selectedUser object to prevent unnecessary re-renders
    // The ref-based tracking (processedMessageIdsRef) ensures we don't process the same message twice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, user?.id, messages.length])
}

