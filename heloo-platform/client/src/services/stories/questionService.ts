/**
 * Question Service
 * Database operations for Q&A sticker responses
 *
 * @module services/stories/questionService
 */

import { supabase } from '@/lib/supabase'

export interface QuestionResponse {
    id: string
    user_id: string
    content: string
    created_at: string
    user?: {
        username: string
        avatar_url: string | null
    }
}

/**
 * Submit a response to a question sticker
 * Also creates a notification for the story owner
 */
export async function submitResponse(
    storyId: string,
    stickerId: string,
    content: string
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Insert response
    const { error } = await supabase
        .from('story_comments')
        .insert({
            story_id: storyId,
            sticker_id: stickerId,
            user_id: user.id,
            content: content.trim()
        })

    if (error) throw error

    // Create notification for story owner (fire and forget)
    createResponseNotification(storyId, user.id).catch(err => {
        console.error('Failed to create notification:', err)
    })
}

/**
 * Create notification for story owner when someone responds
 */
async function createResponseNotification(
    storyId: string,
    responderId: string
): Promise<void> {
    // Get story owner
    const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('user_id, thumbnail_url')
        .eq('id', storyId)
        .single()

    if (storyError || !story) return

    // Don't notify yourself
    if (story.user_id === responderId) return

    // Upsert notification (prevents spam for multiple responses per story)
    const { error } = await supabase
        .from('notifications')
        .upsert({
            recipient_id: story.user_id,
            sender_id: responderId,
            type: 'story_question_response',
            resource_id: storyId,
            resource_type: 'story',
            preview_image_url: story.thumbnail_url,
            is_read: false
        }, {
            onConflict: 'recipient_id,type,resource_id'
        })

    if (error) {
        console.error('Notification upsert failed:', error)
    }
}

/**
 * Get all responses for a question sticker
 */
export async function getResponses(
    storyId: string,
    stickerId: string
): Promise<QuestionResponse[]> {
    const { data, error } = await supabase
        .from('story_comments')
        .select(`
            id,
            user_id,
            content,
            created_at,
            profiles!user_id (
                username,
                avatar_url
            )
        `)
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)
        .order('created_at', { ascending: false })

    if (error) throw error

    // Map Supabase response to QuestionResponse type
    return (data || []).map(row => {
        const profile = row.profiles as unknown as { username: string; avatar_url: string | null } | null
        return {
            id: row.id,
            user_id: row.user_id,
            content: row.content,
            created_at: row.created_at,
            user: profile ? {
                username: profile.username,
                avatar_url: profile.avatar_url
            } : undefined
        }
    })
}

/**
 * Get response count for a question sticker
 */
export async function getResponseCount(
    storyId: string,
    stickerId: string
): Promise<number> {
    const { count, error } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)

    if (error) {
        console.error('Failed to get response count:', error)
        return 0
    }

    return count ?? 0
}

/**
 * Check if current user has responded to a question sticker
 */
export async function hasUserResponded(
    storyId: string,
    stickerId: string
): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
        .from('story_comments')
        .select('id')
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Failed to check user response:', error)
        return false
    }

    return !!data
}
