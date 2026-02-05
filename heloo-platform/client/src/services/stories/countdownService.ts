/**
 * Countdown Service
 * Database operations for countdown reminder subscriptions
 *
 * @module services/stories/countdownService
 */

import { supabase } from '@/lib/supabase'

/**
 * Subscribe current user to countdown reminder
 */
export async function subscribeToReminder(
    storyId: string,
    stickerId: string
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('story_countdown_reminders')
        .upsert({
            story_id: storyId,
            sticker_id: stickerId,
            user_id: user.id
        }, {
            onConflict: 'story_id,sticker_id,user_id'
        })

    if (error) throw error
}

/**
 * Unsubscribe current user from countdown reminder
 */
export async function unsubscribeFromReminder(
    storyId: string,
    stickerId: string
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('story_countdown_reminders')
        .delete()
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)
        .eq('user_id', user.id)

    if (error) throw error
}

/**
 * Check if current user is subscribed to countdown reminder
 */
export async function isSubscribed(
    storyId: string,
    stickerId: string
): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
        .from('story_countdown_reminders')
        .select('id')
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Failed to check reminder subscription:', error)
        return false
    }

    return !!data
}

/**
 * Get reminder count for a countdown sticker (for story owner)
 */
export async function getReminderCount(
    storyId: string,
    stickerId: string
): Promise<number> {
    const { count, error } = await supabase
        .from('story_countdown_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)

    if (error) {
        console.error('Failed to get reminder count:', error)
        return 0
    }

    return count ?? 0
}
