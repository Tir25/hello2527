/**
 * DM Message Actions
 * 
 * Responsibility: Handle direct message (1:1) fetch and send operations
 * Layer: Store Action Creator
 * 
 * Extracted from messageSlice.ts for modularity.
 * Single responsibility: DM-specific messaging logic only.
 */

import type { DatabaseMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { ChatState } from './types'
import { refreshConversationsThrottled } from './conversationSlice'
import { chatService } from '@/lib/services/chat.service'

/**
 * Fetch direct messages between two users
 */
export const fetchDMMessages = async (
    receiverId: string,
    currentUserId: string,
    get: () => ChatState,
    set: (state: Partial<ChatState>) => void
): Promise<void> => {
    try {
        set({ messagesLoading: true, messagesError: null, loading: true, error: null })

        // Try to get chat_deleted_at from current conversations cache
        const { conversations } = get()
        const conv = conversations.find((c) => c.id === receiverId)
        const chatDeletedAt = conv?.chat_deleted_at ?? undefined

        const result = await chatService.fetchMessages(receiverId, currentUserId, chatDeletedAt)

        if (!result.success) {
            const errorMessage = result.error || 'Failed to fetch messages'
            logger.error('dmMessageActions:fetchDMMessages', 'Failed to fetch messages', errorMessage)
            set({
                messagesError: errorMessage,
                messagesLoading: false,
                error: errorMessage,
                loading: false
            })
            toast.error('Unable to load messages. Please try again.')
            return
        }

        const messages = (result.data || []) as DatabaseMessage[]
        set({ messages, messagesLoading: false, loading: false })
        logger.info('dmMessageActions:fetchDMMessages', `Fetched ${messages.length} messages`)
    } catch (err) {
        logger.error('dmMessageActions:fetchDMMessages', 'Unexpected error', err)
        set({
            messagesError: 'An unexpected error occurred',
            messagesLoading: false,
            error: 'An unexpected error occurred',
            loading: false
        })
    }
}

/**
 * Send a direct message to another user
 */
export const sendDMMessage = async (
    content: string,
    receiverId: string,
    currentUserId: string,
    get: () => ChatState,
    set: (state: Partial<ChatState>) => void
): Promise<{ success: boolean; error?: string }> => {
    try {
        const optimisticMessage: DatabaseMessage = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            sender_id: currentUserId,
            receiver_id: receiverId,
            content: content.trim(),
            created_at: new Date().toISOString(),
            status: 'sent',
            delivered_at: null,
            seen_at: null,
        }

        get().addMessage(optimisticMessage)

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUserId,
                receiver_id: receiverId,
                content: content.trim(),
                status: 'sent',
            })

        if (error) {
            logger.error('dmMessageActions:sendDMMessage', 'Failed to send message', error)
            const { messages } = get()
            set({
                messages: messages.filter(m => m.id !== optimisticMessage.id),
                error: error.message || 'Failed to send message'
            })
            return { success: false, error: error.message || 'Failed to send message' }
        }

        // Trigger throttled refresh for new conversations
        refreshConversationsThrottled(get().fetchConversations)

        logger.info('dmMessageActions:sendDMMessage', 'Message sent successfully')
        return { success: true }
    } catch (err) {
        logger.error('dmMessageActions:sendDMMessage', 'Unexpected error', err)
        const { messages } = get()
        set({
            messages: messages.filter(m => !m.id.startsWith('temp-')),
            error: 'An unexpected error occurred'
        })
        return { success: false, error: 'An unexpected error occurred' }
    }
}
