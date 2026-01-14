/**
 * Block Operations
 * 
 * Handle block and unblock operations.
 * @module features/profile/services/relationship/blockOperations
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { profileCacheService } from '../profile-cache.service'
import type { RelationshipResponse } from './types'

/**
 * Block user
 */
export async function blockUser(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase.rpc('block_user', { target_user_id: targetUserId })

        if (error) {
            logger.error('relationship:blockUser', 'Failed to block', error)
            return { success: false, error: error.message || 'Failed to block user' }
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:blockUser', `User blocked: ${targetUserId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:blockUser', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Unblock user
 */
export async function unblockUser(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase.rpc('unblock_user', { target_user_id: targetUserId })

        if (error) {
            logger.error('relationship:unblockUser', 'Failed to unblock', error)
            return { success: false, error: error.message || 'Failed to unblock user' }
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:unblockUser', `User unblocked: ${targetUserId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:unblockUser', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
