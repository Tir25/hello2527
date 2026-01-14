/**
 * Profile Stats Service
 * 
 * Responsibility: Fetch profile statistics (followers, following, posts)
 * Layer: Service (Data)
 * 
 * Max lines: ~50
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { ProfileStats } from '../types/profile.types'

interface StatsResponse {
    success: boolean
    data?: ProfileStats
    error?: string
}

export const profileStatsService = {
    /**
     * Get profile stats for a user
     */
    async getStats(userId: string, joinedYear: number | null): Promise<StatsResponse> {
        try {
            const { data, error } = await supabase
                .rpc('get_profile_stats', { target_user_id: userId })

            if (error) {
                logger.error('profileStatsService:getStats', 'Failed to fetch stats', error)
                return { success: false, error: error.message }
            }

            // RPC returns array with single row
            const stats = data?.[0] || { followers_count: 0, following_count: 0, posts_count: 0 }

            return {
                success: true,
                data: {
                    posts: stats.posts_count || 0,
                    followers: stats.followers_count || 0,
                    following: stats.following_count || 0,
                    joinedDate: joinedYear,
                },
            }
        } catch (error) {
            logger.error('profileStatsService:getStats', 'Unexpected error', error)
            return { success: false, error: 'Failed to fetch stats' }
        }
    },
}
