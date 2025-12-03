import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { DatabaseMessage } from '@/types'
import { STORAGE } from '@/lib/constants/storage'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'

const sendMessageSchema = z.object({
  content: z.string().max(5000, 'Message too long'),
  senderId: z.string().uuid('Invalid sender ID'),
  receiverId: z.string().uuid('Invalid receiver ID'),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'audio', 'document']).optional(),
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

export interface MediaUploadResponse {
  publicUrl: string
  path: string
}

export const chatService = {
  async uploadMedia(
    file: File,
    fileType: 'image' | 'video' | 'document' | 'audio'
  ): Promise<ChatServiceResponse<MediaUploadResponse>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        logger.error('chat:uploadMedia', 'User not authenticated')
        return {
          success: false,
          error: 'storage/unauthenticated',
        }
      }

      // Skip bucket existence check - let the upload attempt handle it
      // This avoids permission issues with listBuckets()

      // Generate unique filename using storage path template
      const fileExt = file.name.split('.').pop() || 'bin'
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const fileName = `${timestamp}-${random}.${fileExt}`
      const filePath = STORAGE.PATH_TEMPLATE(user.id, fileName)

      logger.info('chat:uploadMedia', 'Starting upload', {
        type: fileType,
        size: file.size,
        path: filePath,
      })

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE.BUCKET)
        .upload(filePath, file, {
          cacheControl: STORAGE.CACHE_CONTROL,
          upsert: false,
        })

      if (uploadError) {
        logger.error('chat:uploadMedia', 'Failed to upload file', {
          error: uploadError,
          message: uploadError.message,
          path: filePath,
        })
        return {
          success: false,
          error: uploadError.message || 'storage/upload-failed',
        }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE.BUCKET).getPublicUrl(filePath)

      if (!publicUrl) {
        logger.error('chat:uploadMedia', 'Failed to get public URL', { path: filePath })
        return {
          success: false,
          error: 'storage/url-generation-failed',
        }
      }

      logger.info('chat:uploadMedia', 'File uploaded successfully', {
        path: filePath,
        url: publicUrl,
        size: file.size,
        type: fileType,
      })

      return {
        success: true,
        data: {
          publicUrl,
          path: filePath,
        },
      }
    } catch (error) {
      logger.error('chat:uploadMedia', 'Upload media failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during upload',
      }
    }
  },

  async sendMessage(
    content: string,
    senderId: string,
    receiverId: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'audio' | 'document'
  ): Promise<ChatServiceResponse<DatabaseMessage>> {
    try {
      const validated = sendMessageSchema.parse({
        content: content.trim() || (mediaUrl ? MEDIA_PLACEHOLDER : ''),
        senderId,
        receiverId,
        mediaUrl,
        mediaType,
      })

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: validated.senderId,
          receiver_id: validated.receiverId,
          content: validated.content,
          media_url: validated.mediaUrl,
          media_type: validated.mediaType,
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

