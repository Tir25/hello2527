/**
 * Story Service
 * CRUD operations for stories using Supabase
 * 
 * @module services/stories/storyService
 */

import { supabase } from '@/lib/supabase'
import type { Story, StoryGroup, StoryReaction, StoryViewerInfo } from '@/types'
import { processStoryMentions } from './storyMentionProcessor'

/**
 * Fetch all active stories from friends
 */
export async function fetchStories(): Promise<StoryGroup[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Fetch non-expired stories with user info
    // Scheduled stories: visible to owner immediately, visible to others after scheduled_at
    const now = new Date().toISOString()
    const { data, error } = await supabase
        .from('stories')
        .select(`
      *,
      user:profiles!user_id (
        id,
        username,
        avatar_url
      )
    `)
        .gt('expires_at', now)
        .or(`scheduled_at.is.null,scheduled_at.lte.${now},user_id.eq.${user.id}`)
        .order('posted_at', { ascending: false })

    if (error) throw error
    if (!data) return []

    // Fetch viewed story IDs
    const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id)

    const viewedIds = new Set(views?.map(v => v.story_id) || [])

    // Group stories by user
    const groupMap = new Map<string, StoryGroup>()

    for (const story of data) {
        const userId = story.user_id

        if (!groupMap.has(userId)) {
            groupMap.set(userId, {
                userId,
                user: story.user,
                stories: [],
                hasUnviewed: false,
                latestPostedAt: story.posted_at,
            })
        }

        const group = groupMap.get(userId)!
        group.stories.push(story)

        if (!viewedIds.has(story.id)) {
            group.hasUnviewed = true
        }
    }

    // Sort: own stories first, then by latest post time
    return Array.from(groupMap.values()).sort((a, b) => {
        if (a.userId === user.id) return -1
        if (b.userId === user.id) return 1
        return new Date(b.latestPostedAt).getTime() - new Date(a.latestPostedAt).getTime()
    })
}

/**
 * Fetch stories for a specific user (for profile page)
 */
export async function fetchUserStories(userId: string): Promise<Story[]> {
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('posted_at', { ascending: false })

    if (error) throw error
    return data || []
}

/**
 * Create a new story
 */
export async function createStory(story: Omit<Story, 'id' | 'posted_at' | 'expires_at' | 'view_count'>): Promise<Story> {
    const { data, error } = await supabase
        .from('stories')
        .insert(story)
        .select()
        .single()

    if (error) throw error

    // Process mentions asynchronously (don't block story creation)
    processStoryMentions(data, story.user_id).catch(err =>
        console.error('Failed to process story mentions:', err)
    )

    return data
}

/**
 * Delete a story
 */
export async function deleteStory(storyId: string): Promise<void> {
    const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

    if (error) throw error
}

/**
 * Mark a story as viewed
 */
export async function markStoryViewed(storyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upsert to avoid duplicates
    const { error } = await supabase
        .from('story_views')
        .upsert(
            { story_id: storyId, viewer_id: user.id },
            { onConflict: 'story_id,viewer_id' }
        )

    if (error) {
        console.error('Failed to mark story viewed:', error)
    }
}

/**
 * Fetch viewers for a story with profile info
 */
export async function fetchStoryViewers(storyId: string): Promise<StoryViewerInfo[]> {
    // Execute both queries in parallel for better performance
    const [viewsResult, reactionsResult] = await Promise.all([
        supabase
            .from('story_views')
            .select(`
                viewed_at,
                viewer:profiles!viewer_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('story_id', storyId)
            .order('viewed_at', { ascending: false }),
        supabase
            .from('story_reactions')
            .select('user_id, emoji')
            .eq('story_id', storyId)
    ])

    if (viewsResult.error) throw viewsResult.error
    if (!viewsResult.data) return []

    // Build reaction lookup map
    const userReactions = new Map<string, string>()
    reactionsResult.data?.forEach(r => userReactions.set(r.user_id, r.emoji))

    // Map to StoryViewerInfo format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return viewsResult.data.map((view: any) => ({
        user_id: view.viewer.id,
        username: view.viewer.username,
        avatar_url: view.viewer.avatar_url,
        viewed_at: view.viewed_at,
        has_reacted: userReactions.has(view.viewer.id),
        reaction_emoji: userReactions.get(view.viewer.id) || null
    }))
}


/**
 * Add reaction to a story
 */
export async function addReaction(storyId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('story_reactions')
        .upsert(
            { story_id: storyId, user_id: user.id, emoji },
            { onConflict: 'story_id,user_id' }
        )

    if (error) throw error
}

/**
 * Fetch reactions for a story
 */
export async function fetchReactions(storyId: string): Promise<StoryReaction[]> {
    const { data, error } = await supabase
        .from('story_reactions')
        .select('*')
        .eq('story_id', storyId)

    if (error) throw error
    return data || []
}
