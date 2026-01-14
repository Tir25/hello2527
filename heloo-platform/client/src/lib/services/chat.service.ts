/**
 * Chat Service (Refactored)
 * 
 * Responsibility: Core message send/fetch operations
 * Layer: Service (Data)
 * 
 * Max lines: ~100
 * 
 * Media upload is in mediaUpload.service.ts
 * Message actions (edit, unsend, delete) are in messageActions.service.ts
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { DatabaseMessage, MessagePayload } from '@/types'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'

// Re-export from split services for backward compatibility
export { mediaUploadService, type MediaUploadResponse } from './mediaUpload.service'
export { messageActionsService } from './messageActions.service'

const sendMessageSchema = z.object({
  content: z.string().max(5000, 'Message too long'),
  senderId: z.string().uuid('Invalid sender ID'),
  receiverId: z.string().uuid('Invalid receiver ID'),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'audio', 'document']).optional(),
  replyToId: z.string().uuid('Invalid reply message ID').optional(),
  payload: z.any().optional(),
})

// Note: fetchMessagesSchema removed - validation now done by get_thread_messages RPC

export interface ChatServiceResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export const chatService = {
  /**
   * Send a message with optional media
   */
  async sendMessage(
    content: string,
    senderId: string,
    receiverId: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'audio' | 'document',
    replyToId?: string,
    payload?: MessagePayload
  ): Promise<ChatServiceResponse<DatabaseMessage>> {
    try {
      const validated = sendMessageSchema.parse({
        content: content.trim() || (mediaUrl ? MEDIA_PLACEHOLDER : ''),
        senderId,
        receiverId,
        mediaUrl,
        mediaType,
        replyToId,
        payload,
      })

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: validated.senderId,
          receiver_id: validated.receiverId,
          content: validated.content,
          media_url: validated.mediaUrl,
          media_type: validated.mediaType,
          reply_to_id: validated.replyToId || null,
          payload: validated.payload || null,
        })
        .select()
        .single()

      if (error) {
        logger.error('chat:sendMessage', 'Failed to send message', error)
        return { success: false, error: error.message || 'Failed to send message' }
      }

      logger.info('chat:sendMessage', 'Message sent successfully')
      return { success: true, data: data as DatabaseMessage }
    } catch (error) {
      logger.error('chat:sendMessage', 'Validation or request failed', error)
      return {
        success: false,
        error: error instanceof z.ZodError
          ? error.issues.map((issue) => issue.message).join(', ')
          : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Fetch messages between the current user and otherUserId
   * Uses the get_thread_messages RPC which handles chat_deleted_at filtering
   * This ensures deleted chats stay deleted regardless of follow status changes
   */
  async fetchMessages(
    otherUserId: string,
    _currentUserIdOverride?: string,
    _chatDeletedAtOverride?: string | null
  ): Promise<ChatServiceResponse<DatabaseMessage[]>> {
    try {
      // Use the new RPC that handles all filtering on the database side
      const { data, error } = await supabase.rpc('get_thread_messages', {
        target_user_id: otherUserId
      })

      if (error) {
        logger.error('chat:fetchMessages', 'Failed to fetch messages via RPC', error)
        return { success: false, error: error.message || 'Failed to fetch messages' }
      }

      // Transform RPC response: convert flat reply_to_* fields to nested reply_to object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawMessages = (data || []) as any[]
      const messages: DatabaseMessage[] = rawMessages.map(msg => {
        // Destructure to separate reply fields from rest
        const {
          reply_to_content,
          reply_to_sender_id,
          reply_to_sender_name,
          reply_to_media_type,
          ...rest
        } = msg

        return {
          ...rest,
          // Build nested reply_to object if reply_to_id exists
          reply_to: msg.reply_to_id ? {
            id: msg.reply_to_id,
            content: reply_to_content || '',
            sender_id: reply_to_sender_id || '',
            sender_name: reply_to_sender_name || null,
            media_type: reply_to_media_type || null,
          } : null,
          // Include payload for story mentions and rich content
          payload: msg.payload || null,
        } as DatabaseMessage
      })

      logger.info('chat:fetchMessages', `Fetched ${messages.length} messages via get_thread_messages RPC`)
      return { success: true, data: messages }
    } catch (error) {
      logger.error('chat:fetchMessages', 'Unexpected error', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  },

  // Backward compatibility - delegate to new services
  async uploadMedia(
    file: File,
    fileType: 'image' | 'video' | 'document' | 'audio'
  ) {
    const { mediaUploadService } = await import('./mediaUpload.service')
    return mediaUploadService.upload(file, fileType)
  },

  async unsendMessage(messageId: string) {
    const { messageActionsService } = await import('./messageActions.service')
    return messageActionsService.unsend(messageId)
  },

  async deleteForMe(messageId: string) {
    const { messageActionsService } = await import('./messageActions.service')
    return messageActionsService.deleteForMe(messageId)
  },

  async editMessage(messageId: string, newContent: string) {
    const { messageActionsService } = await import('./messageActions.service')
    return messageActionsService.edit(messageId, newContent)
  },

  /**
   * Archive a chat conversation
   * Uses archive_chat RPC which updates conversation_settings table
   * Completely separated from relationships table
   */
  async archiveChat(userId: string): Promise<ChatServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('archive_chat', {
        target_user_id: userId
      })

      if (error) {
        logger.error('chat:archiveChat', 'Failed to archive chat via RPC', error)
        return { success: false, error: error.message || 'Failed to archive chat' }
      }

      logger.info('chat:archiveChat', `Archived chat with user: ${userId}`)
      return { success: true }
    } catch (error) {
      logger.error('chat:archiveChat', 'Unexpected error archiving chat', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  /**
   * Unarchive a chat conversation
   * Uses unarchive_chat RPC which updates conversation_settings table
   * Completely separated from relationships table
   */
  async unarchiveChat(userId: string): Promise<ChatServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('unarchive_chat', {
        target_user_id: userId
      })

      if (error) {
        logger.error('chat:unarchiveChat', 'Failed to unarchive chat via RPC', error)
        return { success: false, error: error.message || 'Failed to unarchive chat' }
      }

      logger.info('chat:unarchiveChat', `Unarchived chat with user: ${userId}`)
      return { success: true }
    } catch (error) {
      logger.error('chat:unarchiveChat', 'Unexpected error unarchiving chat', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  /**
   * Delete a chat conversation (Permanent)
   * Uses the delete_chat RPC which sets chat_deleted_at timestamp.
   * Messages before this timestamp will be permanently hidden.
   * Does NOT change follow status - preserves the relationship.
   */
  async deleteChat(userId: string): Promise<ChatServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('delete_chat', {
        target_user_id: userId
      })

      if (error) {
        logger.error('chat:deleteChat', 'Failed to delete chat via RPC', error)
        return { success: false, error: error.message || 'Failed to delete chat' }
      }

      logger.info('chat:deleteChat', `Chat deleted permanently with user: ${userId}`)
      return { success: true }
    } catch (error) {
      logger.error('chat:deleteChat', 'Unexpected error deleting chat', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },
}
