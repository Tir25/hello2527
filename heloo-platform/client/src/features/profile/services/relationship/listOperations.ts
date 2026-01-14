/**
 * List Operations
 * 
 * Get incoming requests and accepted connections.
 * @module features/profile/services/relationship/listOperations
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { IncomingRequestsResponse, ConnectionsResponse } from './types'

/**
 * Get incoming connection requests (pending requests where current user is recipient)
 */
export async function getIncomingRequests(): Promise<IncomingRequestsResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        // Fetch FOLLOW requests only (is_chat_request=false)
        const { data: relationships, error: relationshipsError } = await supabase
            .from('relationships')
            .select('id, requester_id, recipient_id, created_at')
            .eq('recipient_id', user.id)
            .eq('status', 'pending')
            .eq('is_chat_request', false)
            .order('created_at', { ascending: false })

        if (relationshipsError) {
            logger.error('relationship:getIncomingRequests', 'Failed to fetch', relationshipsError)
            return { success: false, error: relationshipsError.message || 'Failed to fetch requests' }
        }

        if (!relationships || relationships.length === 0) {
            return { success: true, data: [] }
        }

        // Fetch profiles for all requesters
        const requesterIds = relationships.map((r) => r.requester_id)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, email')
            .in('id', requesterIds)

        if (profilesError) {
            logger.error('relationship:getIncomingRequests', 'Failed to fetch profiles', profilesError)
            return { success: false, error: profilesError.message || 'Failed to fetch profiles' }
        }

        // Combine relationships with profiles
        const requestsWithProfiles = relationships.map((relationship) => {
            const profile = profiles?.find((p) => p.id === relationship.requester_id)
            return {
                id: relationship.requester_id,
                relationship_id: relationship.id,
                requester_id: relationship.requester_id,
                recipient_id: relationship.recipient_id,
                created_at: relationship.created_at,
                profile: profile || {
                    id: relationship.requester_id,
                    full_name: null,
                    username: null,
                    avatar_url: null,
                    email: '',
                },
            }
        })

        logger.info('relationship:getIncomingRequests', `Fetched ${requestsWithProfiles.length} requests`)
        return { success: true, data: requestsWithProfiles }
    } catch (error) {
        logger.error('relationship:getIncomingRequests', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Get all accepted connections (friends)
 */
export async function getAcceptedConnections(): Promise<ConnectionsResponse> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data: relationships, error: relationshipsError } = await supabase
            .from('relationships')
            .select('requester_id, recipient_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

        if (relationshipsError) {
            logger.error('relationship:getAcceptedConnections', 'Failed to fetch', relationshipsError)
            return { success: false, error: relationshipsError.message || 'Failed to fetch connections' }
        }

        if (!relationships || relationships.length === 0) {
            return { success: true, data: [] }
        }

        // Get partner IDs (deduplicated)
        const partnerIds = [...new Set(relationships.map((r) =>
            r.requester_id === user.id ? r.recipient_id : r.requester_id
        ))]

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, email, status, last_seen')
            .in('id', partnerIds)

        if (profilesError) {
            logger.error('relationship:getAcceptedConnections', 'Failed to fetch profiles', profilesError)
            return { success: false, error: profilesError.message || 'Failed to fetch profiles' }
        }

        logger.info('relationship:getAcceptedConnections', `Fetched ${profiles?.length || 0} connections`)
        return { success: true, data: profiles || [] }
    } catch (error) {
        logger.error('relationship:getAcceptedConnections', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
