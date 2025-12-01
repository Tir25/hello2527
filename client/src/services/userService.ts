import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import type { Profile } from '@/lib/services/profile.service'

interface GetUsersResponse {
  success: boolean
  error?: string
  data?: Profile[]
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

