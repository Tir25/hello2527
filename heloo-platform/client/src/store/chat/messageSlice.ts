/**
 * Message Slice
 * 
 * Responsibility: Manage message state, real-time subscriptions, and coordinate actions
 * Layer: Store Slice
 * 
 * Actions are delegated to:
 * - dmMessageActions.ts: DM-specific fetch/send
 * - groupMessageActions.ts: Group-specific fetch/send
 */

import type { StateCreator } from 'zustand'
import type { Profile } from '@/lib/services/profile.service'
import type { DatabaseMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { ChatState, MessageSlice } from './types'
import { fetchDMMessages, sendDMMessage } from './dmMessageActions'
import { fetchGroupMessages as fetchGroupMessagesAction, sendGroupMessage as sendGroupMessageAction } from './groupMessageActions'

export const createMessageSlice: StateCreator<
    ChatState,
    [],
    [],
    MessageSlice
> = (set, get) => ({
    // State
    selectedUser: null,
    messages: [],
    messagesLoading: false,
    messagesError: null,
    users: [],
    loading: false,
    error: null,
    channel: null,

    // ===== Core State Actions =====
    setSelectedUser: (user: Profile | null) => {
        set({ selectedUser: user })

        if (user === null) {
            set({ messages: [] })
            get().unsubscribeFromMessages()
            return
        }

        // Subscribe to status updates for the selected conversation
        supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
            if (currentUser?.id) {
                get().subscribeToMessages(currentUser.id)
            }
        }).catch((err) => {
            logger.error('messageSlice:setSelectedUser', 'Failed to get current user', err)
        })
    },

    setUsers: (users: Profile[]) => {
        set({ users: users.filter((u): u is Profile => u !== null && typeof u === 'object' && 'id' in u) })
    },

    setMessages: (messages: DatabaseMessage[]) => {
        set({ messages })
    },

    addMessage: (message: DatabaseMessage) => {
        const { messages } = get()
        if (!messages.find((m) => m.id === message.id)) {
            set({ messages: [...messages, message] })
        }
    },

    clearChat: () => {
        get().unsubscribeFromMessages()
        set({
            selectedUser: null,
            users: [],
            conversations: [],
            searchResults: [],
            messages: [],
            error: null,
            loading: false,
            isSearching: false
        })
    },

    // ===== DM Message Actions (delegated) =====
    fetchMessages: async (receiverId: string, currentUserId: string) => {
        await fetchDMMessages(receiverId, currentUserId, get, set)
    },

    sendMessage: async (content: string, receiverId: string, currentUserId: string) => {
        return await sendDMMessage(content, receiverId, currentUserId, get, set)
    },

    // ===== Group Message Actions (delegated) =====
    fetchGroupMessages: async (groupId: string) => {
        await fetchGroupMessagesAction(groupId, get, set)
    },

    sendGroupMessage: async (groupId: string, content: string, mediaUrl?: string, mediaType?: string, replyToId?: string) => {
        return await sendGroupMessageAction(groupId, content, get, set, mediaUrl, mediaType, replyToId)
    },

    // ===== Subscription Management =====
    subscribeToMessages: (_currentUserId: string) => {
        get().unsubscribeFromMessages()
        // Global listener handles all real-time updates
        logger.debug('messageSlice:subscribeToMessages', 'Skipped - global listener handles updates')
    },

    unsubscribeFromMessages: () => {
        const { channel } = get()
        if (channel) {
            supabase
                .removeChannel(channel)
                .then(() => {
                    logger.info('messageSlice:unsubscribeFromMessages', 'Channel removed')
                })
                .catch((err) => {
                    logger.error('messageSlice:unsubscribeFromMessages', 'Error removing channel', err)
                })
                .finally(() => {
                    set({ channel: null })
                })
        }
    },

    // ===== Message Update Actions =====
    updateMessageStatus: (messageId, status, deliveredAt, seenAt) => {
        const { messages } = get()
        const updatedMessages = messages.map(msg =>
            msg.id === messageId
                ? { ...msg, status, delivered_at: deliveredAt ?? msg.delivered_at, seen_at: seenAt ?? msg.seen_at }
                : msg
        )
        set({ messages: updatedMessages })
        logger.debug('messageSlice:updateMessageStatus', `Updated ${messageId} to ${status}`)
    },

    updateMessage: (messageId: string, updates: Partial<DatabaseMessage>) => {
        const { messages, conversations } = get()
        const updatedMessages = messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
        )
        set({ messages: updatedMessages })

        // Update conversation preview if content changed
        if (updates.content !== undefined || updates.is_unsent) {
            const affectedMsg = messages.find(msg => msg.id === messageId)
            if (affectedMsg) {
                const partnerId = affectedMsg.sender_id
                const updatedConversations = conversations.map(conv =>
                    conv.last_message && conv.id === partnerId
                        ? { ...conv, last_message: updates.is_unsent ? 'This message was deleted' : (updates.content || conv.last_message) }
                        : conv
                )
                set({ conversations: updatedConversations })
            }
        }

        logger.debug('messageSlice:updateMessage', `Updated message ${messageId}`)
    },

    removeMessage: (messageId: string) => {
        const { messages } = get()
        set({ messages: messages.filter(msg => msg.id !== messageId) })
        logger.debug('messageSlice:removeMessage', `Removed message ${messageId}`)
    },
})
