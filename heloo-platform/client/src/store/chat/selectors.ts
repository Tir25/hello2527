/**
 * Chat Store Selectors - Production Optimized
 * 
 * Provides memoized selectors for efficient state access.
 * Prevents unnecessary re-renders by using shallow equality checks.
 * 
 * Usage:
 * import { useMessages, useSelectedUser } from '@/store/chat/selectors'
 * const messages = useMessages()
 * const selectedUser = useSelectedUser()
 */

import { useChatStore } from './index'
import { useCallback, useMemo } from 'react'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import type { ConversationProfile } from '@/lib/services/user.service'

// ===== Primitive Selectors (Simple Values) =====

/**
 * Select loading state - primitive, no shallow comparison needed
 */
export const useMessagesLoading = () => useChatStore((state) => state.messagesLoading)

/**
 * Select message count - primitive, prevents re-render on message content changes
 */
export const useMessageCount = () => useChatStore((state) => state.messages.length)

/**
 * Select error state - primitive
 */
export const useMessagesError = () => useChatStore((state) => state.messagesError)

/**
 * Select search state - primitive
 */
export const useIsSearching = () => useChatStore((state) => state.isSearching)

/**
 * Select search loading - primitive
 */
export const useSearchLoading = () => useChatStore((state) => state.searchLoading)

/**
 * Select conversations loading - primitive
 */
export const useConversationsLoading = () => useChatStore((state) => state.conversationsLoading)

// ===== Object Selectors (With Memoization) =====

/**
 * Select messages array - returns stable reference when content unchanged
 */
export const useMessages = () => useChatStore((state) => state.messages)

/**
 * Select selected user - returns stable reference when unchanged
 */
export const useSelectedUser = () => useChatStore((state) => state.selectedUser)

/**
 * Select conversations - returns stable reference when unchanged
 */
export const useConversations = () => useChatStore((state) => state.conversations)

/**
 * Select search results - returns stable reference when unchanged
 */
export const useSearchResults = () => useChatStore((state) => state.searchResults)

// ===== Computed Selectors (Derived Data) =====

/**
 * Select messages for a specific conversation
 * Returns memoized array that only changes when relevant messages change
 */
export const useMessagesForUser = (userId: string | null) => {
    const messages = useMessages()
    const currentUserId = useChatStore((state) => state.selectedUser?.id)

    return useMemo(() => {
        if (!userId || !currentUserId) return []
        return messages.filter(
            (m) =>
                (m.sender_id === userId && m.receiver_id === currentUserId) ||
                (m.sender_id === currentUserId && m.receiver_id === userId)
        )
    }, [messages, userId, currentUserId])
}

/**
 * Select unread count for a specific user
 */
export const useUnreadCount = (userId: string) => {
    return useChatStore(
        useCallback(
            (state) => state.conversations.find((c) => c.id === userId)?.unread_count || 0,
            [userId]
        )
    )
}

/**
 * Select total unread count across all conversations
 */
export const useTotalUnreadCount = () => {
    return useChatStore((state) =>
        state.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
    )
}

/**
 * Select global unread count (from server, respects muted/deleted)
 * This is the accurate count that should be used for the notification badge
 */
export const useGlobalUnreadCount = () => useChatStore((state) => state.globalUnreadCount)

/**
 * Check if conversation settings are loaded
 */
export const useSettingsLoaded = () => useChatStore((state) => state.settingsLoaded)

/**
 * Check if a user is typing
 */
export const useIsUserTyping = (userId: string) => {
    return useChatStore(
        useCallback(
            (state) => state.typingUsers.has(userId),
            [userId]
        )
    )
}

/**
 * Check if a user is online
 */
export const useIsUserOnline = (userId: string) => {
    return useChatStore(
        useCallback(
            (state) => state.onlineUsers.has(userId),
            [userId]
        )
    )
}

/**
 * Get last seen time for a user
 */
export const useUserLastSeen = (userId: string) => {
    return useChatStore(
        useCallback(
            (state) => state.userLastSeen.get(userId) || null,
            [userId]
        )
    )
}

// ===== Action Selectors (Stable References) =====

/**
 * Get store actions - returns stable references
 * Use this instead of destructuring from useChatStore to prevent re-renders
 */
export const useChatActions = () => {
    return useChatStore((state) => ({
        setSelectedUser: state.setSelectedUser,
        fetchMessages: state.fetchMessages,
        sendMessage: state.sendMessage,
        fetchConversations: state.fetchConversations,
        searchNewUsers: state.searchNewUsers,
        setIsSearching: state.setIsSearching,
        clearSearch: state.clearSearch,
        clearChat: state.clearChat,
        clearUnreadCount: state.clearUnreadCount,
        // Settings actions
        fetchConversationSettings: state.fetchConversationSettings,
        fetchGlobalUnreadCount: state.fetchGlobalUnreadCount,
    }))
}

// ===== Type-safe getState accessors =====

/**
 * Get current messages directly from store (not reactive)
 * Use for callbacks where you need current value without triggering re-render
 */
export const getMessagesSnapshot = (): DatabaseMessage[] => {
    return useChatStore.getState().messages
}

/**
 * Get selected user directly from store (not reactive)
 */
export const getSelectedUserSnapshot = (): Profile | null => {
    return useChatStore.getState().selectedUser
}

/**
 * Get conversations directly from store (not reactive)
 */
export const getConversationsSnapshot = (): ConversationProfile[] => {
    return useChatStore.getState().conversations
}
