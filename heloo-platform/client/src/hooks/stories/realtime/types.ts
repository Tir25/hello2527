/**
 * Stories Realtime Types
 * Type definitions for realtime story subscription
 * 
 * @module hooks/stories/realtime/types
 */

import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Options for useStoriesRealtime hook
 */
export interface UseStoriesRealtimeOptions {
    /** Enable/disable realtime subscription */
    enabled: boolean
    /** Callback when stories should be refetched */
    refetch: () => Promise<void>
}

/**
 * Related user with relationship status
 */
export interface RelatedUser {
    id: string
    /** User's relationship status with current user */
    status: 'accepted' | 'pending' | 'blocked'
}

/**
 * Story payload from postgres_changes INSERT event
 */
export interface StoryInsertPayload {
    id: string
    user_id: string
    audience_type: string | null
    expires_at: string
    posted_at: string
}

/**
 * Story payload from postgres_changes DELETE event
 */
export interface StoryDeletePayload {
    id: string
    user_id?: string
}

/**
 * Refs for managing realtime lifecycle
 */
export interface RealtimeRefs {
    channel: RealtimeChannel | null
    relationshipChannel: RealtimeChannel | null
    subscribedUserId: string | null
    cleanupTimeout: ReturnType<typeof setTimeout> | null
    debounceTimeout: ReturnType<typeof setTimeout> | null
    pendingRefresh: boolean
    mounted: boolean
}
