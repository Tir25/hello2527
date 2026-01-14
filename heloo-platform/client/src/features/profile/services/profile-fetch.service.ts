/**
 * Profile Fetch Service
 * 
 * Internal fetch helpers for profile data.
 * @module features/profile/services/profile-fetch.service
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Profile, ProfileResponse } from '../types/profile.types'

/**
 * Fetch profile data with RLS fallback
 */
export async function fetchProfileData(userId: string, currentUserId?: string): Promise<{
    data: Profile | null
    result: ProfileResponse & { publicStatus?: string }
}> {
    const { data: fullProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    if (fullProfile) {
        return { data: fullProfile as Profile, result: { success: true } }
    }

    if (!error && !fullProfile && currentUserId && currentUserId !== userId) {
        return fetchPublicProfile(userId, currentUserId)
    }

    if (error) {
        logger.error('profile:fetchData', 'Database error', error)
        return { data: null, result: { success: false, error: error.message || 'Failed to fetch profile' } }
    }

    return { data: null, result: { success: false, error: 'Profile not accessible' } }
}

/**
 * Fetch public profile (RLS fallback)
 */
export async function fetchPublicProfile(userId: string, currentUserId: string): Promise<{
    data: Profile | null
    result: ProfileResponse & { publicStatus?: string }
}> {
    const { data: publicData, error } = await supabase
        .rpc('get_public_profile', { target_user_id: userId, current_user_id: currentUserId })

    if (!error && publicData && publicData.length > 0) {
        const pub = publicData[0]
        const profile: Profile = {
            id: pub.id,
            email: '',
            full_name: pub.full_name,
            username: pub.username,
            phone: null,
            avatar_url: pub.avatar_url,
            status: null,
            last_seen: null,
            created_at: null,
        }

        if (import.meta.env.DEV) {
            logger.info('profile:fetchPublic', `Using public profile fallback: ${userId}`)
        }

        return { data: profile, result: { success: true, publicStatus: pub.relationship_status } }
    }

    logger.warn('profile:fetchPublic', `Profile access blocked: ${userId}`)
    return { data: null, result: { success: false, error: 'Profile not found' } }
}
