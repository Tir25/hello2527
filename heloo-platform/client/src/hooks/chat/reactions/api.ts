/**
 * Reaction API Service
 * 
 * Database operations for message reactions.
 * @module hooks/chat/reactions/api
 */

import { supabase } from '@/lib/supabase'
import { socketService } from '@/lib/services/socket.service'
import { logger } from '@/lib/logger'

interface ReactionRecord {
    emoji: string
    user_id: string
}

/**
 * Fetch all reactions for a message from the database
 */
export async function fetchMessageReactions(messageId: string): Promise<ReactionRecord[]> {
    const { data, error } = await supabase
        .from('message_reactions')
        .select('emoji, user_id')
        .eq('message_id', messageId)

    if (error) throw error
    return data || []
}

/**
 * Delete a user's reaction from a message
 */
export async function deleteReaction(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('message_reactions')
        .delete()
        .match({ message_id: messageId, user_id: userId })

    if (error) throw error
}

/**
 * Insert a new reaction (with upsert fallback for race conditions)
 */
export async function insertReaction(
    messageId: string,
    userId: string,
    emoji: string
): Promise<void> {
    const { error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji })

    if (error) {
        // Handle unique constraint violation (race condition)
        if (error.code === '23505') {
            logger.debug('reactionApi', 'Duplicate reaction - using upsert', { error })
            await upsertReaction(messageId, userId, emoji)
        } else {
            throw error
        }
    }
}

/**
 * Upsert a reaction (insert or update)
 */
export async function upsertReaction(
    messageId: string,
    userId: string,
    emoji: string
): Promise<void> {
    const { error } = await supabase
        .from('message_reactions')
        .upsert(
            { message_id: messageId, user_id: userId, emoji },
            { onConflict: 'message_id,user_id' }
        )

    if (error) throw error
}

/**
 * Emit reaction event via Socket.IO
 */
export function emitReactionEvent(
    messageId: string,
    conversationId: string,
    emoji: string,
    action: 'add' | 'remove'
): void {
    socketService.sendReaction(messageId, conversationId, emoji, action)
}
