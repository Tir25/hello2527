/**
 * User Service
 * 
 * Responsibility: User lookup and search operations
 * Layer: Service (Data)
 * 
 * Conversation queries delegated to: conversationQueries.ts
 * Types defined in: user.types.ts
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Profile } from './profile.service'
import type { RelationshipStatus } from '@/features/profile/types/profile.types'

// Re-export types for backward compatibility
export type {
  ConversationProfile,
  UnifiedConversation,
  GetUsersResponse,
  GetConversationsResponse,
  GetUnifiedConversationsResponse,
} from './user.types'

import type { GetUsersResponse, PublicProfileRPCResponse } from './user.types'

// Re-export conversation queries for backward compatibility
export {
  getConversations,
  getArchivedConversations,
  getUnifiedConversations,
  getUnifiedArchivedConversations,
} from './conversationQueries'

// Import for delegation
import {
  getConversations as getConversationsAction,
  getArchivedConversations as getArchivedConversationsAction,
  getUnifiedConversations as getUnifiedConversationsAction,
  getUnifiedArchivedConversations as getUnifiedArchivedConversationsAction,
} from './conversationQueries'

// ===== User Service =====

export const userService = {
  /**
   * Get all users except current user
   */
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

  /**
   * Search users by query
   */
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

      const { data, error } = await supabase
        .rpc('get_public_profile_data', {
          search_query: trimmedQuery,
          current_user_id: currentUserId,
        })

      if (error) {
        logger.error('userService:searchUsers', 'Failed to search users', error)
        return {
          success: false,
          error: error.message || 'Failed to search users',
        }
      }

      const rpcData = (data || []) as PublicProfileRPCResponse[]
      const mappedData: Profile[] = rpcData.map((item) => ({
        id: item.id,
        email: '',
        full_name: item.full_name,
        username: item.username,
        phone: null,
        avatar_url: item.avatar_url,
        status: item.status || null,  // Bio/status preview
        last_seen: null,
        created_at: null,
        relationship_status: (item.relationship_status || 'none') as RelationshipStatus,
        relationship_id: undefined,
        is_requester: undefined,
        is_blocker: undefined,
        isPendingOutgoing: item.is_pending_outgoing || false,
        isPendingIncoming: item.is_pending_incoming || false,
        amIFollowing: item.am_i_following || false,
        isFollowingMe: item.is_following_me || false,
      }))

      logger.info('userService:searchUsers', `Found ${mappedData.length} users matching "${trimmedQuery}"`)
      return {
        success: true,
        data: mappedData,
      }
    } catch (error) {
      logger.error('userService:searchUsers', 'Unexpected error searching users', error)
      return {
        success: false,
        error: 'An unexpected error occurred while searching users',
      }
    }
  },

  // ===== Delegated Conversation Methods (backward compatibility) =====

  getConversations: getConversationsAction,
  getArchivedConversations: getArchivedConversationsAction,
  getUnifiedConversations: getUnifiedConversationsAction,
  getUnifiedArchivedConversations: getUnifiedArchivedConversationsAction,
}
