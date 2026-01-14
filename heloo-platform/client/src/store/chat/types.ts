/**
 * Chat Store Types
 * 
 * Shared type definitions for all chat store slices.
 * Max lines: ~100
 */

import type { Profile } from '@/lib/services/profile.service'
import type { DatabaseMessage } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ConversationProfile } from '@/lib/services/user.service'

// ===== Presence Slice Types =====
export interface PresenceState {
    onlineUsers: Set<string>
    userLastSeen: Map<string, string>
}

export interface PresenceActions {
    setUserOnline: (userId: string) => void
    setUserOffline: (userId: string, lastSeen?: string) => void
    isUserOnline: (userId: string) => boolean
    getUserLastSeen: (userId: string) => string | null
}

export type PresenceSlice = PresenceState & PresenceActions

// ===== Typing Slice Types =====
export interface TypingUserInfo {
    userId: string
    userName: string
}

export interface TypingState {
    typingUsers: Set<string>
    typingUsersInfo: Map<string, TypingUserInfo>
}

export interface TypingActions {
    setUserTyping: (userId: string, isTyping: boolean, userName?: string) => void
    isUserTyping: (userId: string) => boolean
    getTypingUserNames: () => string[]
}

export type TypingSlice = TypingState & TypingActions

export interface ConversationState {
    conversations: ConversationProfile[]
    conversationsLoading: boolean
    conversationsError: string | null
    // Archived conversations
    archivedConversations: ConversationProfile[]
    archivedConversationsLoading: boolean
    // Contacts: All accepted connections (for universal search)
    contacts: Profile[]
    contactsLoading: boolean
    searchResults: Profile[]
    searchLoading: boolean
    searchError: string | null
    isSearching: boolean
}

export interface ConversationActions {
    fetchConversations: () => Promise<void>
    fetchArchivedConversations: () => Promise<void>
    fetchContacts: () => Promise<void>
    createGroup: (name: string, memberIds: string[]) => Promise<{ success: boolean; groupId?: string; error?: string }>
    searchNewUsers: (query: string, currentUserId: string) => Promise<void>
    setIsSearching: (isSearching: boolean) => void
    clearSearch: () => void
    handleIncomingMessage: (message: DatabaseMessage, currentUserId: string) => void
    clearUnreadCount: (userId: string) => void
}

export type ConversationSlice = ConversationState & ConversationActions

// ===== Settings Slice Types =====
export interface ConversationSettings {
    partner_id: string
    chat_deleted_at: string | null
    is_archived: boolean
    is_muted: boolean
}

export interface SettingsState {
    settingsMap: Map<string, ConversationSettings>
    settingsLoaded: boolean
    globalUnreadCount: number
}

export interface SettingsActions {
    fetchConversationSettings: () => Promise<void>
    fetchGlobalUnreadCount: () => Promise<void>
    getSettingsForUser: (userId: string) => ConversationSettings | undefined
    isUserMuted: (userId: string) => boolean
    isChatDeleted: (userId: string, messageTime: string) => boolean
    updateSettingsForUser: (userId: string, settings: Partial<ConversationSettings>) => void
}

export type SettingsSlice = SettingsState & SettingsActions

// ===== Message Slice Types =====
export interface MessageState {
    selectedUser: Profile | null
    messages: DatabaseMessage[]
    messagesLoading: boolean
    messagesError: string | null
    users: Profile[] // Legacy
    loading: boolean
    error: string | null
    channel: RealtimeChannel | null
}

export interface MessageActions {
    setSelectedUser: (user: Profile | null) => void
    setUsers: (users: Profile[]) => void
    setMessages: (messages: DatabaseMessage[]) => void
    addMessage: (message: DatabaseMessage) => void
    clearChat: () => void
    fetchMessages: (receiverId: string, currentUserId: string) => Promise<void>
    // Group messaging
    fetchGroupMessages: (groupId: string) => Promise<void>
    sendGroupMessage: (groupId: string, content: string, mediaUrl?: string, mediaType?: string, replyToId?: string) => Promise<{ success: boolean; error?: string }>
    sendMessage: (content: string, receiverId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>
    subscribeToMessages: (currentUserId: string) => void
    unsubscribeFromMessages: () => void
    updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'seen', deliveredAt?: string | null, seenAt?: string | null) => void
    updateMessage: (messageId: string, updates: Partial<DatabaseMessage>) => void
    removeMessage: (messageId: string) => void
}

export type MessageSlice = MessageState & MessageActions

// ===== Reply Slice Types =====
export interface ReplyState {
    replyingTo: DatabaseMessage | null
}

export interface ReplyActions {
    setReplyingTo: (message: DatabaseMessage | null) => void
    clearReply: () => void
}

export type ReplySlice = ReplyState & ReplyActions

// ===== Combined Store Type =====
export type ChatState = PresenceSlice & TypingSlice & ConversationSlice & SettingsSlice & MessageSlice & ReplySlice
