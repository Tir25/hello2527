import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { DatabaseMessage } from '@/types'

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  senderId: z.string().uuid('Invalid sender ID'),
  receiverId: z.string().uuid('Invalid receiver ID'),
})

const fetchMessagesSchema = z.object({
  userId1: z.string().uuid('Invalid user ID'),
  userId2: z.string().uuid('Invalid user ID'),
})

export interface ChatServiceResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export const chatService = {
  async sendMessage(
    content: string,
    senderId: string,
    receiverId: string
  ): Promise<ChatServiceResponse<DatabaseMessage>> {
    try {
      const validated = sendMessageSchema.parse({
        content: content.trim(),
        senderId,
        receiverId,
      })

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: validated.senderId,
          receiver_id: validated.receiverId,
          content: validated.content,
        })
        .select()
        .single()

      if (error) {
        logger.error('chat:sendMessage', 'Failed to send message', error)
        return {
          success: false,
          error: error.message || 'Failed to send message',
        }
      }

      logger.info('chat:sendMessage', 'Message sent successfully')
      return {
        success: true,
        data: data as DatabaseMessage,
      }
    } catch (error) {
      logger.error('chat:sendMessage', 'Send message validation or request failed', error)
      return {
        success: false,
        error:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join(', ')
            : 'An unexpected error occurred',
      }
    }
  },

  async fetchMessages(
    userId1: string,
    userId2: string
  ): Promise<ChatServiceResponse<DatabaseMessage[]>> {
    try {
      const validated = fetchMessagesSchema.parse({ userId1, userId2 })

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${validated.userId1},receiver_id.eq.${validated.userId2}),and(sender_id.eq.${validated.userId2},receiver_id.eq.${validated.userId1})`
        )
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('chat:fetchMessages', 'Failed to fetch messages', error)
        return {
          success: false,
          error: error.message || 'Failed to fetch messages',
        }
      }

      const messages = (data || []) as DatabaseMessage[]
      logger.info('chat:fetchMessages', `Fetched ${messages.length} messages`)
      return {
        success: true,
        data: messages,
      }
    } catch (error) {
      logger.error('chat:fetchMessages', 'Fetch messages validation or request failed', error)
      return {
        success: false,
        error:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join(', ')
            : 'An unexpected error occurred',
      }
    }
  },
}

