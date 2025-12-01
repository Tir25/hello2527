import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import type { Profile } from '@/lib/services/profile.service'

// Extended Profile with conversation metadata
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

/**
 * Fetches all users from the profiles table, excluding the current logged-in user
 * @param currentUserId - The ID of the current logged-in user to exclude from results
 * @returns Promise with success status and user data or error message
 */
export const getUsers = async (currentUserId: string): Promise<GetUsersResponse> => {
  // Validate input
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
      .neq('id', currentUserId) // Filter out the current user
      .order('full_name', { ascending: true, nullsFirst: false })

    if (error) {
      logger.error('userService:getUsers', 'Failed to fetch users', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch users',
      }
    }

    // Additional validation: ensure current user is not in results
    const filteredData = (data as Profile[])?.filter((user) => user.id !== currentUserId) || []
    
    logger.info('userService:getUsers', `Successfully fetched ${filteredData.length} users (excluding current user)`)
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
}

/**
 * Fetches all users the current user has conversations with (sent or received messages)
 * Uses the get_my_conversations RPC function for optimal performance
 * Returns users sorted by most recent message
 * @returns Promise with success status and conversation profiles or error message
 */
export const getConversations = async (): Promise<GetConversationsResponse> => {
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
}

/**
 * Searches for users by name (global search)
 * Used when user wants to start a new conversation with someone they haven't talked to
 * @param query - The search query to match against full_name
 * @param currentUserId - The ID of the current logged-in user to exclude from results
 * @returns Promise with success status and matching profiles or error message
 */
export const searchUsers = async (
  query: string,
  currentUserId: string
): Promise<GetUsersResponse> => {
  // Validate inputs
  if (!currentUserId || typeof currentUserId !== 'string' || currentUserId.trim() === '') {
    logger.error('userService:searchUsers', 'Invalid currentUserId provided', { currentUserId })
    return {
      success: false,
      error: 'Invalid user ID provided',
    }
  }

  const rawQuery = typeof query === 'string' ? query : ''
  if (!rawQuery.trim()) {
    // Return empty results for empty query
    return {
      success: true,
      data: [],
    }
  }

  try {
    const trimmedQuery = rawQuery.trim()

    // Escape wildcard characters used by ILIKE so that user input cannot
    // accidentally (or maliciously) control the pattern semantics.
    // Postgres uses '\' as the default escape character for LIKE/ILIKE.
    const escapedQuery = trimmedQuery.replace(/([_%\\])/g, '\\$1')
    const pattern = `%${escapedQuery}%`

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId) // Exclude current user
      .or(`full_name.ilike.${pattern},username.ilike.${pattern},email.ilike.${pattern}`)
      .order('full_name', { ascending: true, nullsFirst: false })
      .limit(20) // Limit search results for performance

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
}
