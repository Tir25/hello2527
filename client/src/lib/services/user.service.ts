import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Profile } from './profile.service'

export interface ConversationProfile extends Profile {
  last_message: string | null
  last_message_time: string | null
  unread_count: number
}

interface GetUsersResponse {
  success: boolean
  error?: string
  data?: Profile[]
}

interface GetConversationsResponse {
  success: boolean
  error?: string
  data?: ConversationProfile[]
}

export const userService = {
  async getUsers(currentUserId: string): Promise<GetUsersResponse> {
    if (!currentUserId || typeof currentUserId !== 'string' || currentUserId.trim() === '') {
      logger.error('userService:getUsers', 'Invalid currentUserId provided', { currentUserId })
      return {
        success: false,
        error: 'Invalid user ID provided',
      }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .order('full_name', { ascending: true, nullsFirst: false })

      if (error) {
        logger.error('userService:getUsers', 'Failed to fetch users', error)
        return {
          success: false,
          error: error.message || 'Failed to fetch users',
        }
      }

      const filteredData = (data as Profile[])?.filter((user) => user.id !== currentUserId) || []

      logger.info('userService:getUsers', `Successfully fetched ${filteredData.length} users`)
      return {
        success: true,
        data: filteredData,
      }
    } catch (error) {
      logger.error('userService:getUsers', 'Unexpected error fetching users', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching users',
      }
    }
  },

  async getConversations(): Promise<GetConversationsResponse> {
    try {
      const { data, error } = await supabase.rpc('get_my_conversations')

      if (error) {
        logger.error('userService:getConversations', 'Failed to fetch conversations', error)
        return {
          success: false,
          error: error.message || 'Failed to fetch conversations',
        }
      }

      const conversations = (data || []) as ConversationProfile[]

      logger.info('userService:getConversations', `Successfully fetched ${conversations.length} conversations`)
      return {
        success: true,
        data: conversations,
      }
    } catch (error) {
      logger.error('userService:getConversations', 'Unexpected error fetching conversations', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching conversations',
      }
    }
  },

  async searchUsers(query: string, currentUserId: string): Promise<GetUsersResponse> {
    if (!currentUserId || typeof currentUserId !== 'string' || currentUserId.trim() === '') {
      logger.error('userService:searchUsers', 'Invalid currentUserId provided', { currentUserId })
      return {
        success: false,
        error: 'Invalid user ID provided',
      }
    }

    const rawQuery = typeof query === 'string' ? query : ''
    if (!rawQuery.trim()) {
      return {
        success: true,
        data: [],
      }
    }

    try {
      const trimmedQuery = rawQuery.trim()
      const escapedQuery = trimmedQuery.replace(/([_%\\])/g, '\\$1')
      const pattern = `%${escapedQuery}%`

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .or(`full_name.ilike.${pattern},username.ilike.${pattern},email.ilike.${pattern}`)
        .order('full_name', { ascending: true, nullsFirst: false })
        .limit(20)

      if (error) {
        logger.error('userService:searchUsers', 'Failed to search users', error)
        return {
          success: false,
          error: error.message || 'Failed to search users',
        }
      }

      const filteredData = (data as Profile[])?.filter((user) => user.id !== currentUserId) || []

      logger.info('userService:searchUsers', `Found ${filteredData.length} users matching "${trimmedQuery}"`)
      return {
        success: true,
        data: filteredData,
      }
    } catch (error) {
      logger.error('userService:searchUsers', 'Unexpected error searching users', error)
      return {
        success: false,
        error: 'An unexpected error occurred while searching users',
      }
    }
  },
}

