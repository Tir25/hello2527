/**
 * Request Operations
 * 
 * Handle send, accept, decline, cancel request operations.
 * @module features/profile/services/relationship/requestOperations
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { profileCacheService } from '../profile-cache.service'
import type { RelationshipResponse } from './types'

/**
 * Send connection request (creates 'pending' relationship)
 */
export async function sendRequest(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data, error } = await supabase
            .from('relationships')
            .upsert(
                {
                    requester_id: user.id,
                    recipient_id: targetUserId,
                    status: 'pending',
                    is_chat_request: false,
                },
                { onConflict: 'requester_id,recipient_id', ignoreDuplicates: false }
            )
            .select()
            .single()

        if (error) {
            logger.error('relationship:sendRequest', 'Failed to send request', error)
            return { success: false, error: error.message || 'Failed to send connection request' }
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:sendRequest', `Request sent to: ${targetUserId}`)
        return { success: true, relationship_id: data.id }
    } catch (error) {
        logger.error('relationship:sendRequest', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Accept connection request
 */
export async function acceptRequest(relationshipId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data: relationshipData } = await supabase
            .from('relationships')
            .select('requester_id, recipient_id')
            .eq('id', relationshipId)
            .single()

        const { error } = await supabase
            .rpc('accept_relationship', { relationship_id: relationshipId })

        if (error) {
            logger.error('relationship:acceptRequest', 'Failed to accept', error)
            return { success: false, error: error.message || 'Failed to accept request' }
        }

        if (relationshipData) {
            profileCacheService.clearMultiple([
                relationshipData.requester_id,
                relationshipData.recipient_id,
            ])
        }

        logger.info('relationship:acceptRequest', `Request accepted: ${relationshipId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:acceptRequest', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Accept a CHAT request only (does NOT create a follow relationship)
 */
export async function acceptChatRequest(requesterId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase
            .rpc('accept_chat_request', { requester_user_id: requesterId })

        if (error) {
            logger.error('relationship:acceptChatRequest', 'Failed to accept chat', error)
            return { success: false, error: error.message || 'Failed to accept chat request' }
        }

        profileCacheService.clearMultiple([requesterId, user.id])
        logger.info('relationship:acceptChatRequest', `Chat accepted from ${requesterId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:acceptChatRequest', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Decline connection request (soft delete - update status to 'none')
 */
export async function declineRequest(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase
            .from('relationships')
            .update({ status: 'none', updated_at: new Date().toISOString() })
            .or(`and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id},status.eq.pending),and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId},status.eq.pending)`)

        if (error) {
            logger.error('relationship:declineRequest', 'Failed to decline', error)
            return { success: false, error: error.message || 'Failed to decline request' }
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:declineRequest', `Request declined: ${targetUserId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:declineRequest', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Cancel MY outgoing pending request (soft delete)
 */
export async function cancelRequest(targetUserId: string): Promise<RelationshipResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase
            .from('relationships')
            .update({ status: 'none', updated_at: new Date().toISOString() })
            .eq('requester_id', user.id)
            .eq('recipient_id', targetUserId)
            .eq('status', 'pending')

        if (error) {
            logger.error('relationship:cancelRequest', 'Failed to cancel', error)
            return { success: false, error: error.message || 'Failed to cancel request' }
        }

        profileCacheService.clearMultiple([targetUserId, user.id])
        logger.info('relationship:cancelRequest', `Request cancelled: ${targetUserId}`)
        return { success: true }
    } catch (error) {
        logger.error('relationship:cancelRequest', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
