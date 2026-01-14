/**
 * useReactions Hook
 * 
 * Manages message reactions via Socket.IO for real-time updates.
 * 
 * Business Rules:
 * - ONE reaction per user per message (enforced by DB constraint)
 * - Selecting same emoji toggles it OFF
 * - Selecting different emoji REPLACES the existing one
 * 
 * @module hooks/chat/reactions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import type { ReactionUpdateEvent } from '@/types/socket.types'
import type { ReactionSummary } from './types'
import {
    isValidUUID,
    groupReactionsByEmoji,
    removeUserFromEmoji,
    addUserToEmoji,
    replaceUserReaction,
    removeUserFromOtherEmojis
} from './utils'
import {
    initSocketListener,
    addReactionListener,
    removeReactionListener
} from './socketManager'
import {
    fetchMessageReactions,
    deleteReaction,
    insertReaction,
    upsertReaction,
    emitReactionEvent
} from './api'

export const useReactions = (messageId?: string, conversationId?: string) => {
    const { user } = useAuthStore()
    const [reactions, setReactions] = useState<ReactionSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const pendingOperation = useRef<boolean>(false)

    // Fetch reactions from database
    const fetchReactions = useCallback(async () => {
        if (!messageId || !isValidUUID(messageId)) {
            setIsLoading(false)
            return
        }

        try {
            const data = await fetchMessageReactions(messageId)
            setReactions(groupReactionsByEmoji(data, user?.id))
        } catch (err) {
            logger.error('useReactions', 'Failed to fetch reactions', err)
        } finally {
            setIsLoading(false)
        }
    }, [messageId, user?.id])

    // Subscribe to real-time updates
    useEffect(() => {
        if (!messageId || !isValidUUID(messageId)) return

        initSocketListener()

        const handleUpdate = (e: ReactionUpdateEvent) => {
            setReactions(prev => {
                let newReactions = [...prev]

                if (e.type === 'add') {
                    // Remove user from other emojis (DB enforces 1 per user)
                    newReactions = removeUserFromOtherEmojis(newReactions, e.emoji, e.userId, user?.id)
                    // Add to target emoji
                    const existingIdx = newReactions.findIndex(r => r.emoji === e.emoji)
                    if (existingIdx >= 0) {
                        const r = newReactions[existingIdx]
                        if (!r.users.includes(e.userId)) {
                            newReactions[existingIdx] = {
                                ...r,
                                users: [...r.users, e.userId],
                                count: r.users.length + 1,
                                hasReacted: e.userId === user?.id ? true : r.hasReacted
                            }
                        }
                    } else {
                        newReactions.push({
                            emoji: e.emoji,
                            count: 1,
                            users: [e.userId],
                            hasReacted: e.userId === user?.id
                        })
                    }
                } else {
                    // Remove
                    const existingIdx = newReactions.findIndex(r => r.emoji === e.emoji)
                    if (existingIdx >= 0) {
                        const r = newReactions[existingIdx]
                        if (r.users.includes(e.userId)) {
                            const updatedUsers = r.users.filter(u => u !== e.userId)
                            if (updatedUsers.length === 0) {
                                newReactions.splice(existingIdx, 1)
                            } else {
                                newReactions[existingIdx] = {
                                    ...r,
                                    users: updatedUsers,
                                    count: updatedUsers.length,
                                    hasReacted: e.userId === user?.id ? false : r.hasReacted
                                }
                            }
                        }
                    }
                }

                return newReactions
            })
        }

        addReactionListener(messageId, handleUpdate)
        fetchReactions()

        return () => {
            removeReactionListener(messageId, handleUpdate)
        }
    }, [messageId, user?.id, fetchReactions])

    // Toggle reaction on a message
    const toggleReaction = useCallback(async (emoji: string) => {
        if (!user || !messageId || !isValidUUID(messageId)) return
        if (pendingOperation.current) return

        pendingOperation.current = true
        const previousReactions = reactions
        const myCurrentReaction = reactions.find(r => r.hasReacted)
        const isSameEmoji = myCurrentReaction?.emoji === emoji

        try {
            if (isSameEmoji) {
                // Toggle OFF: Same emoji clicked
                setReactions(prev => removeUserFromEmoji(prev, emoji, user.id))
                await deleteReaction(messageId, user.id)
                if (conversationId) {
                    emitReactionEvent(messageId, conversationId, emoji, 'remove')
                }
            } else if (myCurrentReaction) {
                // Replace: Different emoji
                const oldEmoji = myCurrentReaction.emoji
                setReactions(prev => replaceUserReaction(prev, oldEmoji, emoji, user.id))
                await upsertReaction(messageId, user.id, emoji)
                if (conversationId) {
                    emitReactionEvent(messageId, conversationId, oldEmoji, 'remove')
                    emitReactionEvent(messageId, conversationId, emoji, 'add')
                }
            } else {
                // Add: No existing reaction
                setReactions(prev => addUserToEmoji(prev, emoji, user.id))
                await insertReaction(messageId, user.id, emoji)
                if (conversationId) {
                    emitReactionEvent(messageId, conversationId, emoji, 'add')
                }
            }
        } catch (err) {
            logger.error('useReactions', 'Failed to toggle reaction', err)
            setReactions(previousReactions)
        } finally {
            pendingOperation.current = false
        }
    }, [user, messageId, conversationId, reactions])

    // Legacy APIs (kept for compatibility)
    const addReaction = useCallback((emoji: string) => toggleReaction(emoji), [toggleReaction])
    const removeReaction = useCallback((emoji: string) => toggleReaction(emoji), [toggleReaction])

    return { reactions, isLoading, addReaction, removeReaction, toggleReaction }
}
