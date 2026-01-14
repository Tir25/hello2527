/**
 * Handle Message Update Event
 * 
 * Responsibility: Process UPDATE events from Supabase Realtime
 * Layer: Event Handler
 * 
 * Extracted from useGlobalMessageListener for modularity.
 * Handles: Status changes (delivered/seen), edits, unsends, delete-for-me.
 */

import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import type { DatabaseMessage } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Creates a handler for message update events
 * @param currentUserId - The authenticated user's ID
 */
export const createMessageUpdateHandler = (currentUserId: string) => {
    return (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
        try {
            const updatedMessage = payload.new as DatabaseMessage
            const oldMessage = payload.old as Partial<DatabaseMessage>

            logger.info('handleMessageUpdate', 'Message updated', {
                messageId: updatedMessage.id,
                oldStatus: oldMessage.status,
                newStatus: updatedMessage.status,
                isEdited: updatedMessage.is_edited,
                isUnsent: updatedMessage.is_unsent,
            })

            // Get store actions
            const { updateMessage, removeMessage, updateMessageStatus } = useChatStore.getState()

            // Check if this message was deleted for current user
            if (updatedMessage.deleted_for?.includes(currentUserId)) {
                removeMessage(updatedMessage.id)
                logger.debug('handleMessageUpdate', 'Removed message deleted for current user', {
                    messageId: updatedMessage.id,
                })
                return
            }

            // Handle content/edit/unsend updates
            if (
                updatedMessage.content !== oldMessage.content ||
                updatedMessage.is_edited !== oldMessage.is_edited ||
                updatedMessage.is_unsent !== oldMessage.is_unsent
            ) {
                updateMessage(updatedMessage.id, {
                    content: updatedMessage.content,
                    is_edited: updatedMessage.is_edited,
                    is_unsent: updatedMessage.is_unsent,
                    media_url: updatedMessage.media_url,
                    deleted_for: updatedMessage.deleted_for,
                })
                logger.debug('handleMessageUpdate', 'Updated message content/state', {
                    messageId: updatedMessage.id,
                    isEdited: updatedMessage.is_edited,
                    isUnsent: updatedMessage.is_unsent,
                })
            }

            // Handle status changes (delivered/seen)
            if (updatedMessage.status !== oldMessage.status) {
                try {
                    updateMessageStatus(
                        updatedMessage.id,
                        updatedMessage.status,
                        updatedMessage.delivered_at,
                        updatedMessage.seen_at
                    )
                } catch (err) {
                    logger.error('handleMessageUpdate', 'Error updating message status in store', err)
                }
            }
        } catch (err) {
            logger.error('handleMessageUpdate', 'Unexpected error processing message update', err)
        }
    }
}
