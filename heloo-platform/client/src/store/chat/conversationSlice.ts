/**
 * Conversation Slice
 * 
 * Manage conversation list, search, contacts, and unread counts.
 * @module store/chat/conversationSlice
 */

import type { StateCreator } from 'zustand'
import { logger } from '@/lib/logger'
import { userService } from '@/lib/services/user.service'
import { groupService } from '@/lib/services/group.service'
import { relationshipService } from '@/features/profile/services/relationship'
import type { ChatState, ConversationSlice } from './types'
import type { Profile } from '@/lib/services/profile.service'
import { handleIncomingMessageUpdate, refreshConversationsThrottled } from './conversationMessageHandler'

export { refreshConversationsThrottled }

export const createConversationSlice: StateCreator<ChatState, [], [], ConversationSlice> = (set, get) => ({
    // State
    conversations: [],
    conversationsLoading: false,
    conversationsError: null,
    archivedConversations: [],
    archivedConversationsLoading: false,
    contacts: [],
    contactsLoading: false,
    searchResults: [],
    searchLoading: false,
    searchError: null,
    isSearching: false,

    // Fetch conversations
    fetchConversations: async () => {
        try {
            set({ conversationsLoading: true, conversationsError: null })
            const result = await userService.getConversations()

            if (result.success && result.data) {
                set({ conversations: result.data, conversationsLoading: false })
                logger.info('conversationSlice:fetchConversations', `Loaded ${result.data.length} conversations`)
            } else {
                set({ conversationsError: result.error || 'Failed to load conversations', conversationsLoading: false })
                logger.error('conversationSlice:fetchConversations', 'Failed to fetch conversations', result.error)
            }
        } catch (err) {
            logger.error('conversationSlice:fetchConversations', 'Unexpected error', err)
            set({ conversationsError: 'An unexpected error occurred', conversationsLoading: false })
        }
    },

    fetchArchivedConversations: async () => {
        try {
            set({ archivedConversationsLoading: true })
            const result = await userService.getArchivedConversations()

            if (result.success && result.data) {
                set({ archivedConversations: result.data, archivedConversationsLoading: false })
                logger.info('conversationSlice:fetchArchivedConversations', `Loaded ${result.data.length} archived conversations`)
            } else {
                set({ archivedConversationsLoading: false })
                logger.error('conversationSlice:fetchArchivedConversations', 'Failed to fetch archived conversations', result.error)
            }
        } catch (err) {
            logger.error('conversationSlice:fetchArchivedConversations', 'Unexpected error', err)
            set({ archivedConversationsLoading: false })
        }
    },

    fetchContacts: async () => {
        try {
            set({ contactsLoading: true })
            const result = await relationshipService.getAcceptedConnections()

            if (result.success && result.data) {
                set({ contacts: result.data as Profile[], contactsLoading: false })
                logger.info('conversationSlice:fetchContacts', `Loaded ${result.data.length} contacts`)
            } else {
                set({ contactsLoading: false })
                logger.error('conversationSlice:fetchContacts', 'Failed to fetch contacts', result.error)
            }
        } catch (err) {
            logger.error('conversationSlice:fetchContacts', 'Unexpected error', err)
            set({ contactsLoading: false })
        }
    },

    searchNewUsers: async (query: string, currentUserId: string) => {
        if (!query.trim()) {
            set({ searchResults: [], isSearching: false })
            return
        }

        try {
            set({ searchLoading: true, searchError: null, isSearching: true })
            const result = await userService.searchUsers(query, currentUserId)

            if (result.success && result.data) {
                set({ searchResults: result.data, searchLoading: false })
                logger.info('conversationSlice:searchNewUsers', `Found ${result.data.length} users`)
            } else {
                set({ searchError: result.error || 'Failed to search users', searchLoading: false })
                logger.error('conversationSlice:searchNewUsers', 'Search failed', result.error)
            }
        } catch (err) {
            logger.error('conversationSlice:searchNewUsers', 'Unexpected error', err)
            set({ searchError: 'An unexpected error occurred', searchLoading: false })
        }
    },

    createGroup: async (name: string, memberIds: string[]) => {
        try {
            const result = await groupService.createGroup({ name, memberIds })

            if (result.success && result.data) {
                logger.info('conversationSlice:createGroup', `Group "${name}" created successfully`)
                await get().fetchConversations()
                return { success: true, groupId: result.data.id }
            } else {
                logger.error('conversationSlice:createGroup', 'Failed to create group', result.error)
                return { success: false, error: result.error || 'Failed to create group' }
            }
        } catch (err) {
            logger.error('conversationSlice:createGroup', 'Unexpected error', err)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    setIsSearching: (isSearching: boolean) => {
        set({ isSearching })
        if (!isSearching) set({ searchResults: [] })
    },

    clearSearch: () => {
        set({ searchResults: [], isSearching: false, searchError: null })
    },

    handleIncomingMessage: (message, currentUserId: string) => {
        const { conversations, selectedUser, fetchConversations, isUserMuted, isChatDeleted } = get()

        const result = handleIncomingMessageUpdate(message, currentUserId, {
            conversations,
            selectedUser,
            fetchConversations,
            isUserMuted,
            isChatDeleted,
        })

        if (result) {
            set({ conversations: result })
        } else {
            // Null result means new conversation - refresh needed
            const conversationId = message.group_id || (message.sender_id === currentUserId ? message.receiver_id : message.sender_id)
            if (conversationId && !conversations.find(c => c.id === conversationId)) {
                void refreshConversationsThrottled(fetchConversations)
            }
        }
    },

    clearUnreadCount: (userId: string) => {
        const { conversations } = get()
        const updatedConversations = conversations.map(conv =>
            conv.id === userId ? { ...conv, unread_count: 0 } : conv
        )
        set({ conversations: updatedConversations })
        logger.debug('conversationSlice:clearUnreadCount', `Cleared unread count for user ${userId}`)
    },
})
