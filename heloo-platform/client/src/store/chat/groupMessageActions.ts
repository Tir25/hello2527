/**
 * Group Message Actions
 * 
 * Responsibility: Handle group message fetch and send operations
 * Layer: Store Action Creator
 * 
 * Extracted from messageSlice.ts for modularity.
 * Single responsibility: Group-specific messaging logic only.
 */

import type { DatabaseMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import { socketService } from '@/lib/services/socket.service'
import type { ChatState } from './types'
import { refreshConversationsThrottled } from './conversationSlice'

/**
 * Fetch messages for a group chat
 */
export const fetchGroupMessages = async (
    groupId: string,
    _get: () => ChatState,
    set: (state: Partial<ChatState>) => void
): Promise<void> => {
    try {
        set({ messagesLoading: true, messagesError: null, loading: true, error: null })

        const { data, error } = await supabase.rpc('get_group_messages', {
            p_group_id: groupId,
            p_limit: 100,
        })

        if (error) {
            logger.error('groupMessageActions:fetchGroupMessages', 'Failed to fetch group messages', error)
            set({
                messagesError: error.message || 'Failed to fetch group messages',
                messagesLoading: false,
                error: error.message || 'Failed to fetch group messages',
                loading: false
            })
            toast.error('Unable to load group messages. Please try again.')
            return
        }

        // Transform RPC response: convert flat reply_to_* fields to nested reply_to object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawMessages = (data || []) as any[]
        const messages: DatabaseMessage[] = rawMessages.map(msg => {
            // Destructure to separate reply fields from rest
            const {
                reply_to_content,
                reply_to_sender_id,
                reply_to_sender_name,
                reply_to_media_type,
                ...rest
            } = msg

            return {
                ...rest,
                // Build nested reply_to object if reply_to_id exists
                reply_to: msg.reply_to_id ? {
                    id: msg.reply_to_id,
                    content: reply_to_content || '',
                    sender_id: reply_to_sender_id || '',
                    sender_name: reply_to_sender_name || null,
                    media_type: reply_to_media_type || null,
                } : null,
                // Include payload for story mentions and rich content
                payload: msg.payload || null,
            } as DatabaseMessage
        }).reverse() // Reverse to get chronological order (RPC returns DESC)

        set({ messages, messagesLoading: false, loading: false })
        logger.info('groupMessageActions:fetchGroupMessages', `Fetched ${messages.length} group messages`)
    } catch (err) {
        logger.error('groupMessageActions:fetchGroupMessages', 'Unexpected error', err)
        set({
            messagesError: 'An unexpected error occurred',
            messagesLoading: false,
            error: 'An unexpected error occurred',
            loading: false
        })
    }
}

/**
 * Send a message to a group chat
 */
export const sendGroupMessage = async (
    groupId: string,
    content: string,
    get: () => ChatState,
    set: (state: Partial<ChatState>) => void,
    mediaUrl?: string,
    mediaType?: string,
    replyToId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get the replyingTo message from store to build optimistic reply_to object
        const replyingTo = get().replyingTo
        const replyToData = replyToId && replyingTo ? {
            id: replyingTo.id,
            content: replyingTo.content || '',
            sender_id: replyingTo.sender_id,
            sender_name: replyingTo.sender_name || null,
            media_type: replyingTo.media_type || null,
        } : null

        const optimisticMessage: DatabaseMessage = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            sender_id: user.id,
            receiver_id: null,
            group_id: groupId,
            content: content.trim() || '',
            created_at: new Date().toISOString(),
            status: 'sent',
            delivered_at: null,
            seen_at: null,
            media_url: mediaUrl || null,
            media_type: mediaType as DatabaseMessage['media_type'] || null,
            reply_to_id: replyToId || null,
            reply_to: replyToData,
        }

        get().addMessage(optimisticMessage)

        const { data, error } = await supabase.rpc('send_group_message', {
            p_group_id: groupId,
            p_content: content.trim() || '',
            p_media_url: mediaUrl || null,
            p_media_type: mediaType || null,
            p_reply_to_id: replyToId || null,
        })

        if (error) {
            logger.error('groupMessageActions:sendGroupMessage', 'Failed to send group message', error)
            const { messages } = get()
            set({
                messages: messages.filter(m => m.id !== optimisticMessage.id),
                error: error.message || 'Failed to send group message'
            })
            return { success: false, error: error.message || 'Failed to send group message' }
        }

        // Trigger throttled refresh for conversation updates
        refreshConversationsThrottled(get().fetchConversations)

        // Emit to socket for real-time update with full reply_to data
        // Uses existing id (from RPC response) and optimistic data
        const realMessage: DatabaseMessage = {
            ...optimisticMessage,
            id: data // The real UUID from database
        }

        // Import socketService dynamically or at top? Top is fine.
        socketService.sendMessage(groupId, realMessage)

        logger.info('groupMessageActions:sendGroupMessage', `Group message sent, id: ${data}`)
        return { success: true }
    } catch (err) {
        logger.error('groupMessageActions:sendGroupMessage', 'Unexpected error', err)
        const { messages } = get()
        set({
            messages: messages.filter(m => !m.id.startsWith('temp-')),
            error: 'An unexpected error occurred'
        })
        return { success: false, error: 'An unexpected error occurred' }
    }
}
