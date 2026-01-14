/**
 * Reaction State Utilities
 * 
 * Pure functions for updating reaction state.
 * Extracted for testability and clarity.
 * 
 * @module hooks/chat/reactions/utils
 */

import type { ReactionSummary } from './types'

/**
 * Validate UUID format to prevent 400 errors with temp IDs
 */
export const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Group raw reaction data by emoji
 */
export function groupReactionsByEmoji(
    data: Array<{ emoji: string; user_id: string }>,
    currentUserId?: string
): ReactionSummary[] {
    return data.reduce((acc, curr) => {
        const existing = acc.find(r => r.emoji === curr.emoji)
        if (existing) {
            if (!existing.users.includes(curr.user_id)) {
                existing.users.push(curr.user_id)
                existing.count = existing.users.length
            }
            if (curr.user_id === currentUserId) existing.hasReacted = true
        } else {
            acc.push({
                emoji: curr.emoji,
                count: 1,
                hasReacted: curr.user_id === currentUserId,
                users: [curr.user_id]
            })
        }
        return acc
    }, [] as ReactionSummary[])
}

/**
 * Remove a user from a specific emoji's reaction list
 */
export function removeUserFromEmoji(
    reactions: ReactionSummary[],
    emoji: string,
    userId: string
): ReactionSummary[] {
    return reactions
        .map(r => {
            if (r.emoji === emoji && r.users.includes(userId)) {
                const updatedUsers = r.users.filter(u => u !== userId)
                return {
                    ...r,
                    users: updatedUsers,
                    count: updatedUsers.length,
                    hasReacted: false
                }
            }
            return r
        })
        .filter(r => r.count > 0)
}

/**
 * Add a user to a specific emoji's reaction list
 */
export function addUserToEmoji(
    reactions: ReactionSummary[],
    emoji: string,
    userId: string
): ReactionSummary[] {
    const newReactions = [...reactions]
    const existingIdx = newReactions.findIndex(r => r.emoji === emoji)

    if (existingIdx >= 0) {
        const r = newReactions[existingIdx]
        if (!r.users.includes(userId)) {
            newReactions[existingIdx] = {
                ...r,
                users: [...r.users, userId],
                count: r.users.length + 1,
                hasReacted: true
            }
        }
    } else {
        newReactions.push({
            emoji,
            count: 1,
            users: [userId],
            hasReacted: true
        })
    }

    return newReactions
}

/**
 * Replace user's reaction from one emoji to another
 */
export function replaceUserReaction(
    reactions: ReactionSummary[],
    oldEmoji: string,
    newEmoji: string,
    userId: string
): ReactionSummary[] {
    // Remove from old emoji
    let newReactions = removeUserFromEmoji(reactions, oldEmoji, userId)
    // Add to new emoji
    newReactions = addUserToEmoji(newReactions, newEmoji, userId)
    return newReactions
}

/**
 * Remove user from any emoji they have reacted to (except target emoji)
 */
export function removeUserFromOtherEmojis(
    reactions: ReactionSummary[],
    targetEmoji: string,
    userId: string,
    currentUserId?: string
): ReactionSummary[] {
    const newReactions: ReactionSummary[] = []

    for (const r of reactions) {
        if (r.emoji !== targetEmoji && r.users.includes(userId)) {
            const updatedUsers = r.users.filter(u => u !== userId)
            if (updatedUsers.length > 0) {
                newReactions.push({
                    ...r,
                    users: updatedUsers,
                    count: updatedUsers.length,
                    hasReacted: userId === currentUserId ? false : r.hasReacted
                })
            }
            // If count becomes 0, we skip adding it (effectively removing)
        } else {
            newReactions.push(r)
        }
    }

    return newReactions
}
