/**
 * Handle Group Message Event
 * 
 * Responsibility: Process group INSERT events with client-side filtering
 * Layer: Event Handler
 * 
 * Extracted from useGlobalMessageListener for modularity.
 * Supabase Realtime does NOT support `is.null` filter.
 * We subscribe WITHOUT filter and do client-side filtering for group messages.
 */

import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import type { DatabaseMessage } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createNewMessageHandler } from './handleNewMessage'

/**
 * Creates a handler for group message events with client-side filtering
 * @param currentUserId - The authenticated user's ID
 */
export const createGroupMessageHandler = (currentUserId: string) => {
    const handleNewMessage = createNewMessageHandler(currentUserId)

    return (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
        const newMessage = payload.new as DatabaseMessage

        // Only process GROUP messages (has group_id, no receiver_id)
        if (!newMessage.group_id || newMessage.receiver_id) {
            return // This is a DM, not a group message - other channels handle it
        }

        // Skip if this is our own message (sender channel handles it)
        if (newMessage.sender_id === currentUserId) {
            return
        }

        // Check if user is a member of this group
        const { conversations } = useChatStore.getState()
        const isGroupMember = conversations.some(
            (c) => c.id === newMessage.group_id && c.is_group
        )

        if (isGroupMember) {
            logger.info('handleGroupMessage', 'Group message from other member received', {
                messageId: newMessage.id,
                groupId: newMessage.group_id,
                senderId: newMessage.sender_id,
            })
            handleNewMessage(payload)
        }
    }
}
