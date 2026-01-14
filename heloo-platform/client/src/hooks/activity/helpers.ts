/**
 * Activity Helpers
 * 
 * Utility functions for activity/request data
 */

import type { Profile } from '@/features/profile/types/profile.types'
import type { IncomingRequest } from './types'

/**
 * Get display name from request profile
 */
export const getDisplayName = (request: IncomingRequest): string => {
    return (
        request.profile.full_name ||
        request.profile.username ||
        request.profile.email.split('@')[0] ||
        'User'
    )
}

/**
 * Create Profile object from request for Avatar component
 */
export const getProfileFromRequest = (request: IncomingRequest): Profile => ({
    id: request.profile.id,
    email: request.profile.email,
    full_name: request.profile.full_name,
    username: request.profile.username,
    avatar_url: request.profile.avatar_url,
    phone: null,
    status: null,
    last_seen: null,
    created_at: null,
})
