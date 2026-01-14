/**
 * Connections Service
 * 
 * Responsibility: Fetch followers/following lists with search
 * Layer: Service (Data)
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface ConnectionUser {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    status: string | null
    relationship_status: string
}

interface ConnectionsResponse {
    success: boolean
    data?: ConnectionUser[]
    error?: string
}

export const connectionsService = {
    /**
     * Get followers list for a user
     */
    async getFollowers(
        userId: string,
        searchQuery?: string,
        limit = 20,
        offset = 0
    ): Promise<ConnectionsResponse> {
        try {
            const { data, error } = await supabase.rpc('get_followers_list', {
                target_user_id: userId,
                search_query: searchQuery || null,
                page_limit: limit,
                page_offset: offset,
            })

            if (error) {
                logger.error('connectionsService:getFollowers', 'Failed to fetch', error)
                return { success: false, error: error.message }
            }

            return { success: true, data: data || [] }
        } catch (error) {
            logger.error('connectionsService:getFollowers', 'Unexpected error', error)
            return { success: false, error: 'Failed to fetch followers' }
        }
    },

    /**
     * Get following list for a user
     */
    async getFollowing(
        userId: string,
        searchQuery?: string,
        limit = 20,
        offset = 0
    ): Promise<ConnectionsResponse> {
        try {
            const { data, error } = await supabase.rpc('get_following_list', {
                target_user_id: userId,
                search_query: searchQuery || null,
                page_limit: limit,
                page_offset: offset,
            })

            if (error) {
                logger.error('connectionsService:getFollowing', 'Failed to fetch', error)
                return { success: false, error: error.message }
            }

            return { success: true, data: data || [] }
        } catch (error) {
            logger.error('connectionsService:getFollowing', 'Unexpected error', error)
            return { success: false, error: 'Failed to fetch following' }
        }
    },
}
