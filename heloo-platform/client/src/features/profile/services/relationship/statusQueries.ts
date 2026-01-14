/**
 * Status Queries
 * 
 * Get relationship status and details.
 * @module features/profile/services/relationship/statusQueries
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { RelationshipStatus, RelationshipDetails } from './types'

/**
 * Get relationship status between current user and target user
 */
export async function getRelationshipStatus(targetUserId: string): Promise<RelationshipStatus> {
    try {
        const { data, error } = await supabase
            .rpc('get_relationship_status', { other_user_id: targetUserId })

        if (error) {
            logger.error('relationship:getStatus', 'Failed to get status', error)
            return 'none'
        }

        return (data as RelationshipStatus) || 'none'
    } catch (error) {
        logger.error('relationship:getStatus', 'Unexpected error', error)
        return 'none'
    }
}

/**
 * Get relationship details (id, requester, recipient)
 */
export async function getRelationshipDetails(
    currentUserId: string,
    targetUserId: string
): Promise<RelationshipDetails | null> {
    try {
        const { data } = await supabase
            .from('relationships')
            .select('id, requester_id, recipient_id, status')
            .or(`and(requester_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`)
            .maybeSingle()

        return data
    } catch (error) {
        logger.error('relationship:getDetails', 'Unexpected error', error)
        return null
    }
}

export interface RelationshipData {
    status: 'none' | 'pending' | 'accepted' | 'blocked'
    id: string | undefined
    isRequester: boolean | undefined
    isBlocker: boolean | undefined
    amIFollowing: boolean | undefined
    isFollowingMe: boolean | undefined
    isPendingOutgoing: boolean | undefined
    isPendingIncoming: boolean | undefined
}

/**
 * Fetch relationship data between current user and target user.
 * Checks both directions to determine follow states and pending requests.
 */
export async function fetchRelationshipData(
    userId: string,
    currentUserId: string,
    publicStatus?: string
): Promise<RelationshipData> {
    const { data: relationships } = await supabase
        .from('relationships')
        .select('id, requester_id, recipient_id, status')
        .or(`and(requester_id.eq.${currentUserId},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${currentUserId})`)

    const myFollow = relationships?.find(r => r.requester_id === currentUserId && r.recipient_id === userId)
    const theirFollow = relationships?.find(r => r.requester_id === userId && r.recipient_id === currentUserId)

    const amIFollowing = myFollow?.status === 'accepted'
    const isFollowingMe = theirFollow?.status === 'accepted'
    const isBlocked = myFollow?.status === 'blocked' || theirFollow?.status === 'blocked'
    const isPendingOutgoing = myFollow?.status === 'pending'
    const isPendingIncoming = theirFollow?.status === 'pending'

    let status: 'none' | 'pending' | 'accepted' | 'blocked' = 'none'
    if (isBlocked) status = 'blocked'
    else if (amIFollowing || isFollowingMe) status = 'accepted'
    else if (isPendingOutgoing || isPendingIncoming) status = 'pending'

    if (!relationships?.length && publicStatus) {
        status = publicStatus as 'none' | 'pending' | 'accepted' | 'blocked'
    }

    return {
        status,
        id: myFollow?.id || theirFollow?.id,
        isRequester: !!myFollow,
        isBlocker: myFollow?.status === 'blocked' ? true : undefined,
        amIFollowing,
        isFollowingMe,
        isPendingOutgoing,
        isPendingIncoming,
    }
}
