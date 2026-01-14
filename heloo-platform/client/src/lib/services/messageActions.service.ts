/**
 * Message Actions Service
 * 
 * Responsibility: Handle message edit, unsend, delete operations
 * Layer: Service (Data)
 * 
 * Max lines: ~100
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface MessageActionResponse {
    success: boolean
    error?: string
    data?: boolean
}

export const messageActionsService = {
    /**
     * Unsend a message (Delete for Everyone)
     * Wipes content and media, marks as unsent
     * Only the sender can unsend their own messages
     */
    async unsend(messageId: string): Promise<MessageActionResponse> {
        try {
            const { data, error } = await supabase.rpc('unsend_message', {
                message_id: messageId,
            })

            if (error) {
                logger.error('messageActions:unsend', 'Failed to unsend message', error)
                return { success: false, error: error.message || 'Failed to unsend message' }
            }

            logger.info('messageActions:unsend', `Message ${messageId} unsent: ${data}`)
            return { success: true, data: data as boolean }
        } catch (error) {
            logger.error('messageActions:unsend', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    /**
     * Delete a message for the current user only
     * The message remains visible to the other participant
     */
    async deleteForMe(messageId: string): Promise<MessageActionResponse> {
        try {
            const { data, error } = await supabase.rpc('delete_message_for_me', {
                message_id: messageId,
            })

            if (error) {
                logger.error('messageActions:deleteForMe', 'Failed to delete message', error)
                return { success: false, error: error.message || 'Failed to delete message' }
            }

            logger.info('messageActions:deleteForMe', `Message ${messageId} deleted: ${data}`)
            return { success: true, data: data as boolean }
        } catch (error) {
            logger.error('messageActions:deleteForMe', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    /**
     * Edit a message's content
     * Only the sender can edit their own messages
     * Cannot edit unsent messages
     */
    async edit(messageId: string, newContent: string): Promise<MessageActionResponse> {
        try {
            if (!newContent.trim()) {
                return { success: false, error: 'Message content cannot be empty' }
            }

            const { data, error } = await supabase.rpc('edit_message', {
                message_id: messageId,
                new_content: newContent.trim(),
            })

            if (error) {
                logger.error('messageActions:edit', 'Failed to edit message', error)
                return { success: false, error: error.message || 'Failed to edit message' }
            }

            logger.info('messageActions:edit', `Message ${messageId} edited: ${data}`)
            return { success: true, data: data as boolean }
        } catch (error) {
            logger.error('messageActions:edit', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },
}
