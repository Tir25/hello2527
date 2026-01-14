/**
 * Follow Operations
 * 
 * Handle follow and unfollow operations.
 * @module features/profile/services/relationship/followOperations
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { profileCacheService } from '../profile-cache.service'
import type { RelationshipResponse } from './types'

/**
 * Send a follow request (creates 'pending' relationship)
 * Uses check-first pattern to PRESERVE chat_deleted_at when refollowing
 */
export async function followUser(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        // Check if a row already exists
        const { data: existingRow, error: checkError } = await supabase
            .from('relationships')
            .select('id, status, requester_chat_deleted_at')
            .eq('requester_id', user.id)
            .eq('recipient_id', targetUserId)
            .maybeSingle()

        if (checkError) {
            logger.error('relationship:followUser', 'Failed to check existing row', checkError)
            return { success: false, error: checkError.message || 'Failed to check relationship' }
        }

        let resultData: { id: string } | null = null

        if (existingRow) {
            // Row exists - UPDATE only status (preserve chat_deleted_at)
            const { data, error } = await supabase
                .from('relationships')
                .update({
                    status: 'pending',
                    is_chat_request: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingRow.id)
                .select('id')
                .single()

            if (error) {
                logger.error('relationship:followUser', 'Failed to update', error)
                return { success: false, error: error.message || 'Failed to send follow request' }
            }
            resultData = data
        } else {
            // No row exists - INSERT new row
            const { data, error } = await supabase
                .from('relationships')
                .insert({
                    requester_id: user.id,
                    recipient_id: targetUserId,
                    status: 'pending',
                    is_chat_request: false,
                })
                .select('id')
                .single()

            if (error) {
                logger.error('relationship:followUser', 'Failed to insert', error)
                return { success: false, error: error.message || 'Failed to send follow request' }
            }
            resultData = data
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:followUser', `Follow request sent to: ${targetUserId}`)
        return { success: true, relationship_id: resultData?.id }
    } catch (error) {
        logger.error('relationship:followUser', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Unfollow (soft delete - preserves metadata like chat_deleted_at)
 */
export async function unfollow(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase.rpc('unfollow_user', {
            target_user_id: targetUserId
        })

        if (error) {
            logger.error('relationship:unfollow', 'Failed to unfollow', error)
            return { success: false, error: error.message || 'Failed to unfollow user' }
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:unfollow', `Unfollowed: ${targetUserId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:unfollow', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
