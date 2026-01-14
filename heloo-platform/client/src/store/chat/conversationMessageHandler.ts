/**
 * Conversation Message Handler
 * 
 * Handles incoming messages for conversation list updates.
 * @module store/chat/conversationMessageHandler
 */

import { logger } from '@/lib/logger'
import type { ConversationProfile } from '@/lib/services/user.service'
import type { DatabaseMessage } from '@/types'

// Throttle helper
let lastConversationsRefresh = 0

export const refreshConversationsThrottled = async (fetchConversations: () => Promise<void>) => {
    const now = Date.now()
    if (now - lastConversationsRefresh < 1000) return
    lastConversationsRefresh = now
    await fetchConversations()
}

interface HandleMessageContext {
    conversations: ConversationProfile[]
    selectedUser: { id: string } | null
    fetchConversations: () => Promise<void>
    isUserMuted: (userId: string) => boolean
    isChatDeleted: (userId: string, messageTime: string) => boolean
}

export function handleIncomingMessageUpdate(
    message: DatabaseMessage,
    currentUserId: string,
    context: HandleMessageContext
): ConversationProfile[] | null {
    const { conversations, selectedUser, isUserMuted, isChatDeleted } = context

    const isGroupMessage = !!message.group_id
    let conversationId: string

    if (isGroupMessage) {
        conversationId = message.group_id!
    } else {
        conversationId = message.sender_id === currentUserId
            ? (message.receiver_id || '')
            : message.sender_id
    }

    if (!conversationId) {
        logger.warn('conversationSlice:handleIncomingMessage', 'Could not determine conversation ID')
        return null
    }

    const isMuted = !isGroupMessage && isUserMuted(conversationId)
    const isDeleted = !isGroupMessage && isChatDeleted(conversationId, message.created_at)

    if (isDeleted) {
        logger.debug('conversationSlice:handleIncomingMessage', `Ignoring message from deleted chat: ${conversationId}`)
        return null
    }

    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId)

    if (conversationIndex === -1) {
        // Return null to indicate refresh needed
        return null
    }

    const conversation = conversations[conversationIndex]
    const isCurrentlyViewing = selectedUser?.id === conversationId
    const shouldIncrementUnread = !isCurrentlyViewing && !isMuted && message.sender_id !== currentUserId

    const updatedConversation: ConversationProfile = {
        ...conversation,
        last_message: message.content,
        last_message_time: message.created_at,
        unread_count: shouldIncrementUnread
            ? (conversation.unread_count || 0) + 1
            : (conversation.unread_count || 0)
    }

    const updatedConversations = [
        updatedConversation,
        ...conversations.filter((_, idx) => idx !== conversationIndex)
    ]

    if (isMuted) {
        logger.info('conversationSlice:handleIncomingMessage', `Received message from muted user ${conversationId} (not counting as unread)`)
    } else {
        const msgType = isGroupMessage ? 'group' : 'DM'
        logger.info('conversationSlice:handleIncomingMessage', `Updated ${msgType} conversation: ${conversationId}`)
    }

    return updatedConversations
}
