/**
 * Story Mention Utilities
 * 
 * Handles extraction of mentions from story stickers and validation
 * 
 * @module services/stories/storyMentionUtils
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Sticker } from '@/types'

/**
 * Extract usernames from mention stickers
 * @param stickers - Array of stickers from story
 * @returns Array of lowercase usernames (without @ prefix)
 */
export function extractMentions(stickers: Sticker[] | null | undefined): string[] {
    if (!stickers?.length) return []

    return stickers
        .filter((s): s is Sticker => s.type === 'mention')
        .map(s => {
            // Handle both string and potential object data
            const raw = typeof s.data === 'string' ? s.data : ''
            // Strip @ prefix and lowercase
            return raw.replace(/^@/, '').toLowerCase().trim()
        })
        .filter(Boolean)
}

/**
 * Resolve username to user ID
 * @param username - The username to resolve
 * @returns User ID or null if not found
 */
export async function resolveUsername(username: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', username)
            .maybeSingle()

        if (error) {
            logger.warn('resolveUsername', `Failed to resolve: ${username}`, error)
            return null
        }

        return data?.id ?? null
    } catch (err) {
        logger.error('resolveUsername', 'Unexpected error', err)
        return null
    }
}

/**
 * Check if viewer can access story based on audience type
 * @param ownerId - Story owner's user ID
 * @param viewerId - Potential viewer's user ID
 * @param audienceType - Story audience type ('public' or 'close_friends')
 * @returns True if viewer can access the story
 */
export async function canViewStory(
    ownerId: string,
    viewerId: string,
    audienceType: string
): Promise<boolean> {
    // Public stories can be viewed by anyone (who follows)
    if (audienceType !== 'close_friends') return true

    try {
        const { data, error } = await supabase
            .from('close_friends')
            .select('friend_id')
            .eq('user_id', ownerId)
            .eq('friend_id', viewerId)
            .maybeSingle()

        if (error) {
            logger.warn('canViewStory', 'Failed to check close friends', error)
            return false
        }

        return !!data
    } catch (err) {
        logger.error('canViewStory', 'Unexpected error', err)
        return false
    }
}

/**
 * Check if conversation with partner is muted
 * @param ownerId - Settings owner's user ID
 * @param partnerId - Conversation partner's user ID
 * @returns True if conversation is muted
 */
export async function isConversationMuted(
    ownerId: string,
    partnerId: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('conversation_settings')
            .select('is_muted')
            .eq('owner_id', ownerId)
            .eq('partner_id', partnerId)
            .maybeSingle()

        if (error) {
            logger.warn('isConversationMuted', 'Failed to check mute status', error)
            return false
        }

        return data?.is_muted ?? false
    } catch (err) {
        logger.error('isConversationMuted', 'Unexpected error', err)
        return false
    }
}
