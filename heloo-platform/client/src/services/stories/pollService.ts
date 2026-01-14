/**
 * Poll Service
 * Handles poll voting and results fetching with optimistic updates
 *
 * @module services/stories/pollService
 */

import { supabase } from '@/lib/supabase'

export interface PollResults {
    total: number
    votes: number[]
    percentages: number[]
    userVote: number | null
}

/** Error codes */
const ALREADY_VOTED_CODE = '23505' // Unique constraint violation

/**
 * Submit a vote for a poll sticker
 * Returns true if vote was successful, false if already voted
 */
export async function submitVote(
    storyId: string,
    stickerId: string,
    optionIndex: number
): Promise<{ success: boolean; alreadyVoted: boolean }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('story_poll_votes')
        .insert({
            story_id: storyId,
            user_id: user.id,
            sticker_id: stickerId,
            option_index: optionIndex
        })

    if (error) {
        // Handle duplicate vote gracefully (409 Conflict / unique constraint)
        if (error.code === ALREADY_VOTED_CODE) {
            return { success: false, alreadyVoted: true }
        }
        throw error
    }

    return { success: true, alreadyVoted: false }
}

/**
 * Get poll results for a sticker
 */
export async function getPollResults(
    storyId: string,
    stickerId: string,
    optionCount: number
): Promise<PollResults> {
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all votes for this poll
    const { data: votes, error } = await supabase
        .from('story_poll_votes')
        .select('option_index, user_id')
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)

    if (error) throw error

    // Initialize vote counts
    const voteCounts = new Array(optionCount).fill(0)
    let userVote: number | null = null

    // Count votes
    for (const vote of votes || []) {
        if (vote.option_index >= 0 && vote.option_index < optionCount) {
            voteCounts[vote.option_index]++
        }
        if (user && vote.user_id === user.id) {
            userVote = vote.option_index
        }
    }

    const total = voteCounts.reduce((a, b) => a + b, 0)
    const percentages = voteCounts.map(count =>
        total > 0 ? Math.round((count / total) * 100) : 0
    )

    return {
        total,
        votes: voteCounts,
        percentages,
        userVote
    }
}

/**
 * Calculate optimistic results after voting
 * Used for instant UI feedback before server confirms
 */
export function calculateOptimisticResults(
    currentResults: PollResults | null,
    optionIndex: number,
    optionCount: number
): PollResults {
    const current = currentResults || {
        total: 0,
        votes: new Array(optionCount).fill(0),
        percentages: new Array(optionCount).fill(0),
        userVote: null
    }

    // Create new vote counts with the user's vote
    const newVotes = [...current.votes]
    newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1

    const newTotal = current.total + 1
    const newPercentages = newVotes.map(count =>
        newTotal > 0 ? Math.round((count / newTotal) * 100) : 0
    )

    return {
        total: newTotal,
        votes: newVotes,
        percentages: newPercentages,
        userVote: optionIndex
    }
}

/** Voter info for detailed results */
export interface PollVoter {
    user_id: string
    username: string
    avatar_url: string | null
    option_index: number
}

/** Detailed poll results with voter info (for story owners) */
export interface DetailedPollResults extends PollResults {
    voters: PollVoter[]
}

/**
 * Get detailed poll results with voter profiles
 * Only story owner should call this (RLS enforced on server)
 */
export async function getDetailedPollResults(
    storyId: string,
    stickerId: string,
    optionCount: number
): Promise<DetailedPollResults> {
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch votes with voter profiles
    const { data: votes, error } = await supabase
        .from('story_poll_votes')
        .select(`
            option_index,
            user_id,
            profiles:user_id (
                id,
                username,
                avatar_url
            )
        `)
        .eq('story_id', storyId)
        .eq('sticker_id', stickerId)

    if (error) throw error

    // Initialize vote counts
    const voteCounts = new Array(optionCount).fill(0)
    let userVote: number | null = null
    const voters: PollVoter[] = []

    // Count votes and collect voter info
    for (const vote of votes || []) {
        if (vote.option_index >= 0 && vote.option_index < optionCount) {
            voteCounts[vote.option_index]++
        }
        if (user && vote.user_id === user.id) {
            userVote = vote.option_index
        }

        // Add voter info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profile = (vote as any).profiles as { id: string; username: string; avatar_url: string | null } | null
        if (profile && profile.id) {
            voters.push({
                user_id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url,
                option_index: vote.option_index
            })
        }
    }

    const total = voteCounts.reduce((a, b) => a + b, 0)
    const percentages = voteCounts.map(count =>
        total > 0 ? Math.round((count / total) * 100) : 0
    )

    return {
        total,
        votes: voteCounts,
        percentages,
        userVote,
        voters
    }
}
