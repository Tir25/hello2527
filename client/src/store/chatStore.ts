import { create } from 'zustand'
import type { Profile } from '@/lib/services/profile.service'
import type { DatabaseMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { userService, type ConversationProfile } from '@/lib/services/user.service'

interface ChatState {
  // User selection
  selectedUser: Profile | null
  
  // Conversation list (users with chat history) - WhatsApp-style default view
  conversations: ConversationProfile[]
  conversationsLoading: boolean
  conversationsError: string | null
  
  // Search results (global search for new users)
  searchResults: Profile[]
  searchLoading: boolean
  searchError: string | null
  isSearching: boolean // true when search bar has text
  
  // Messages for current conversation
  messages: DatabaseMessage[]
  messagesLoading: boolean
  messagesError: string | null
  
  // Legacy users array (kept for backward compatibility)
  users: Profile[]
  loading: boolean
  error: string | null
  
  // Realtime channel
  channel: RealtimeChannel | null
  
  // Presence tracking
  onlineUsers: Set<string> // Set of online user IDs
  userLastSeen: Map<string, string> // Map of userId -> last_seen timestamp
  
  // Typing indicators
  typingUsers: Set<string> // Set of user IDs who are currently typing
  
  // Actions
  setSelectedUser: (user: Profile | null) => void
  setUsers: (users: Profile[]) => void
  setMessages: (messages: DatabaseMessage[]) => void
  addMessage: (message: DatabaseMessage) => void
  clearChat: () => void
  
  // Presence actions
  setUserOnline: (userId: string) => void
  setUserOffline: (userId: string, lastSeen?: string) => void
  isUserOnline: (userId: string) => boolean
  getUserLastSeen: (userId: string) => string | null
  
  // Typing actions
  setUserTyping: (userId: string, isTyping: boolean) => void
  isUserTyping: (userId: string) => boolean
  
  // New actions for WhatsApp-style sidebar
  fetchConversations: () => Promise<void>
  searchNewUsers: (query: string, currentUserId: string) => Promise<void>
  setIsSearching: (isSearching: boolean) => void
  clearSearch: () => void
  
  // Message operations
  fetchMessages: (receiverId: string, currentUserId: string) => Promise<void>
  sendMessage: (content: string, receiverId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>
  subscribeToMessages: (currentUserId: string) => void
  unsubscribeFromMessages: () => void
  
  // Global message listener action
  handleIncomingMessage: (message: DatabaseMessage, currentUserId: string) => void
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'seen', deliveredAt?: string | null, seenAt?: string | null) => void
  clearUnreadCount: (userId: string) => void
}

/**
 * Chat store for managing WhatsApp/Instagram-style conversations
 * - Default view shows users with chat history (conversations)
 * - Search triggers global user search
 * - New users appear in conversations only after first message
 */
export const useChatStore = create<ChatState>((set, get) => {
  // Throttle conversation refreshes triggered by messages so that we
  // don't spam the database when sendMessage and subscriptions fire
  // close together. This keeps behaviour correct while avoiding
  // unnecessary RPC traffic.
  let lastConversationsRefresh = 0
  const refreshConversationsThrottled = async () => {
    const now = Date.now()
    if (now - lastConversationsRefresh < 1000) {
      // Skip if we've refreshed within the last second
      return
    }
    lastConversationsRefresh = now
    await get().fetchConversations()
  }

  return {
  selectedUser: null,
  
  // Conversations state
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  
  // Search state
  searchResults: [],
  searchLoading: false,
  searchError: null,
  isSearching: false,
  
  // Messages state
  messages: [],
  messagesLoading: false,
  messagesError: null,
  
  // Legacy state (backward compatibility)
  users: [],
  loading: false,
  error: null,
  
  channel: null,
  
  // Presence state
  onlineUsers: new Set<string>(),
  userLastSeen: new Map<string, string>(),
  
  // Typing state
  typingUsers: new Set<string>(),

  setSelectedUser: (user: Profile | null) => {
    set({ selectedUser: user })
    
    // Clear messages when selecting a new user
    if (user === null) {
      set({ messages: [] })
      get().unsubscribeFromMessages()
      return
    }
    
    // Subscribe to status updates for the selected conversation
    // Note: Global listener handles INSERT events, this handles UPDATE events
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (currentUser?.id) {
        // Subscribe to status updates
        get().subscribeToMessages(currentUser.id)
        
        // NEW LOW #1: Removed duplicate mark_messages_seen RPC call
        // ChatWindow now handles marking messages as seen with proper tracking refs
        // This prevents duplicate calls and ensures single source of truth
        // Unread count will be cleared by ChatWindow after marking as seen
      }
    }).catch((err) => {
      logger.error('chatStore:setSelectedUser', 'Failed to get current user', err)
    })
  },

  setUsers: (users: Profile[]) => {
    // Ensure all users are valid Profile objects
    set({ users: users.filter((u): u is Profile => u !== null && typeof u === 'object' && 'id' in u) })
  },

  setMessages: (messages: DatabaseMessage[]) => {
    set({ messages })
  },

  addMessage: (message: DatabaseMessage) => {
    const { messages } = get()
    // Avoid duplicates
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

  /**
   * Fetches users the current user has conversations with
   * Uses the get_my_conversations RPC for optimal performance
   */
  fetchConversations: async () => {
    try {
      set({ conversationsLoading: true, conversationsError: null })
      
      const result = await userService.getConversations()

      if (result.success && result.data) {
        set({ 
          conversations: result.data,
          conversationsLoading: false 
        })
        logger.info('chatStore:fetchConversations', `Loaded ${result.data.length} conversations`)
      } else {
        set({ 
          conversationsError: result.error || 'Failed to load conversations',
          conversationsLoading: false 
        })
        logger.error('chatStore:fetchConversations', 'Failed to fetch conversations', result.error)
      }
    } catch (err) {
      logger.error('chatStore:fetchConversations', 'Unexpected error', err)
      set({ 
        conversationsError: 'An unexpected error occurred',
        conversationsLoading: false 
      })
    }
  },

  /**
   * Searches for users globally (to start new conversations)
   */
  searchNewUsers: async (query: string, currentUserId: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false })
      return
    }

    try {
      set({ searchLoading: true, searchError: null, isSearching: true })
      
      const result = await userService.searchUsers(query, currentUserId)

      if (result.success && result.data) {
        set({ 
          searchResults: result.data,
          searchLoading: false 
        })
        logger.info('chatStore:searchNewUsers', `Found ${result.data.length} users`)
      } else {
        set({ 
          searchError: result.error || 'Failed to search users',
          searchLoading: false 
        })
        logger.error('chatStore:searchNewUsers', 'Search failed', result.error)
      }
    } catch (err) {
      logger.error('chatStore:searchNewUsers', 'Unexpected error', err)
      set({ 
        searchError: 'An unexpected error occurred',
        searchLoading: false 
      })
    }
  },

  setIsSearching: (isSearching: boolean) => {
    set({ isSearching })
    if (!isSearching) {
      set({ searchResults: [] })
    }
  },

  clearSearch: () => {
    set({ 
      searchResults: [], 
      isSearching: false,
      searchError: null 
    })
  },

  fetchMessages: async (receiverId: string, currentUserId: string) => {
    try {
      set({ messagesLoading: true, messagesError: null, loading: true, error: null })
      
      // PRODUCTION FIX: Single efficient query using OR condition
      // Uses the composite index messages_conversation_idx for optimal performance
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('chatStore:fetchMessages', 'Failed to fetch messages', error)
        const errorMessage = error.message || 'Failed to fetch messages'
        set({ 
          messagesError: errorMessage, 
          messagesLoading: false,
          error: errorMessage, 
          loading: false 
        })
        toast.error('Unable to load messages. Please try again.')
        return
      }

      const messages = (data || []) as DatabaseMessage[]
      set({ messages, messagesLoading: false, loading: false })
      logger.info('chatStore:fetchMessages', `Fetched ${messages.length} messages in single query`)
    } catch (err) {
      logger.error('chatStore:fetchMessages', 'Unexpected error fetching messages', err)
      set({ 
        messagesError: 'An unexpected error occurred', 
        messagesLoading: false,
        error: 'An unexpected error occurred', 
        loading: false 
      })
    }
  },

  sendMessage: async (content: string, receiverId: string, currentUserId: string) => {
    try {
      // Optimistically add message to UI for instant feedback
      // MEDIUM FIX #3: Include proper status fields
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
      
      // Add optimistic message immediately
      get().addMessage(optimisticMessage)

      // Insert message - data not needed as subscription will handle adding it
      // NEW ISSUE #2 FIX: Explicitly set status field (better than relying on database default)
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: content.trim(),
          status: 'sent', // Explicit is better than implicit
        })

      if (error) {
        logger.error('chatStore:sendMessage', 'Failed to send message', error)
        // Remove optimistic message on error
        const { messages } = get()
        set({ 
          messages: messages.filter(m => m.id !== optimisticMessage.id),
          error: error.message || 'Failed to send message'
        })
        return { success: false, error: error.message || 'Failed to send message' }
      }

      // Let the real-time subscription handle adding the real message.
      // We intentionally keep the optimistic message in the list so the
      // user does not see a flicker while we wait for the subscription.
      // The subscription handler will swap it out for the real message.

      // Trigger a throttled conversations refresh so the new conversation
      // appears in the sidebar if this is the first message to this user.
      refreshConversationsThrottled()

      logger.info('chatStore:sendMessage', 'Message sent successfully - waiting for subscription update')
      return { success: true }
    } catch (err) {
      logger.error('chatStore:sendMessage', 'Unexpected error sending message', err)
      // Clean up any optimistic messages on error
      const { messages } = get()
      set({ 
        messages: messages.filter(m => !m.id.startsWith('temp-')),
        error: 'An unexpected error occurred'
      })
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  subscribeToMessages: (_currentUserId: string) => {
    // Unsubscribe from any existing channel
    get().unsubscribeFromMessages()

    // CRITICAL FIX: Supabase Realtime doesn't support complex `or()` filter syntax
    // useGlobalMessageListener now handles all real-time updates globally with proper filters
    // This function is kept for backward compatibility but is now a no-op since
    // the global listener handles both INSERT and UPDATE events for sent/received messages
    logger.debug('chatStore:subscribeToMessages', 'Skipped - global listener handles real-time updates')
  },

  unsubscribeFromMessages: () => {
    const { channel } = get()
    if (channel) {
      // PRODUCTION FIX: Properly unsubscribe and verify channel removal
      supabase
        .removeChannel(channel)
        .then(() => {
          logger.info('chatStore:unsubscribeFromMessages', 'Channel removed successfully')
        })
        .catch((err) => {
          logger.error('chatStore:unsubscribeFromMessages', 'Error removing channel', err)
        })
        .finally(() => {
          // Always clear channel reference even if removal fails
          set({ channel: null })
        })
    }
  },

  // Presence actions
  setUserOnline: (userId: string) => {
    const { onlineUsers, userLastSeen } = get()
    const newOnlineUsers = new Set(onlineUsers)
    newOnlineUsers.add(userId)
    // Remove from last seen when user comes online
    const newLastSeen = new Map(userLastSeen)
    newLastSeen.delete(userId)
    set({ onlineUsers: newOnlineUsers, userLastSeen: newLastSeen })
    logger.info('chatStore:setUserOnline', `User ${userId} is now online`)
  },

  setUserOffline: (userId: string, lastSeen?: string) => {
    const { onlineUsers, userLastSeen } = get()
    const newOnlineUsers = new Set(onlineUsers)
    newOnlineUsers.delete(userId)
    const newLastSeen = new Map(userLastSeen)
    if (lastSeen) {
      newLastSeen.set(userId, lastSeen)
    }
    set({ onlineUsers: newOnlineUsers, userLastSeen: newLastSeen })
    logger.info('chatStore:setUserOffline', `User ${userId} is now offline`, { lastSeen })
  },

  isUserOnline: (userId: string) => {
    return get().onlineUsers.has(userId)
  },

  getUserLastSeen: (userId: string) => {
    return get().userLastSeen.get(userId) || null
  },

  // Typing actions
  setUserTyping: (userId: string, isTyping: boolean) => {
    const { typingUsers } = get()
    
    // MEDIUM FIX #4: Check if state actually changed before updating
    // This prevents unnecessary re-renders and Set creation
    const currentlyTyping = typingUsers.has(userId)
    
    // If state hasn't changed, don't update (no-op)
    if (currentlyTyping === isTyping) {
      return
    }
    
    // Only create new Set if state needs to change
    const newTypingUsers = new Set(typingUsers)
    
    if (isTyping) {
      newTypingUsers.add(userId)
    } else {
      newTypingUsers.delete(userId)
    }
    
    set({ typingUsers: newTypingUsers })
    // LOW FIX #8: Use debug level instead of info for frequent typing events
    logger.debug('chatStore:setUserTyping', `User ${userId} ${isTyping ? 'started' : 'stopped'} typing`)
  },

  isUserTyping: (userId: string) => {
    return get().typingUsers.has(userId)
  },

  /**
   * Handles incoming messages from global listener
   * - Reorders conversation to top
   * - Updates last_message
   * - Increments unread_count if not viewing that chat
   */
  handleIncomingMessage: (message: DatabaseMessage, currentUserId: string) => {
    const { conversations, selectedUser } = get()
    
    // Find the conversation with the sender
    const senderId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id
    const conversationIndex = conversations.findIndex(conv => conv.id === senderId)
    
    if (conversationIndex === -1) {
      // New conversation - will be added by fetchConversations
      // Just trigger a refresh
      void refreshConversationsThrottled()
      return
    }
    
    // Create updated conversation
    const conversation = conversations[conversationIndex]
    const isCurrentlyViewing = selectedUser?.id === senderId
    
    // LOW FIX #2: Always fallback to 0 for unread_count
    const updatedConversation: ConversationProfile = {
      ...conversation,
      last_message: message.content,
      last_message_time: message.created_at,
      unread_count: isCurrentlyViewing 
        ? (conversation.unread_count || 0)
        : (conversation.unread_count || 0) + 1
    }
    
    // Remove from current position and add to top
    const updatedConversations = [
      updatedConversation,
      ...conversations.filter((_, idx) => idx !== conversationIndex)
    ]
    
    set({ conversations: updatedConversations })
    logger.info('chatStore:handleIncomingMessage', `Updated conversation for user ${senderId}, unread: ${updatedConversation.unread_count}`)
  },

  /**
   * Updates message status in the messages array
   */
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'seen', deliveredAt?: string | null, seenAt?: string | null) => {
    const { messages } = get()
    const updatedMessages = messages.map(msg => 
      msg.id === messageId
        ? { ...msg, status, delivered_at: deliveredAt ?? msg.delivered_at, seen_at: seenAt ?? msg.seen_at }
        : msg
    )
    set({ messages: updatedMessages })
    logger.debug('chatStore:updateMessageStatus', `Updated message ${messageId} status to ${status}`)
  },

  /**
   * Clears unread count for a specific conversation
   */
  clearUnreadCount: (userId: string) => {
    const { conversations } = get()
    const updatedConversations = conversations.map(conv =>
      conv.id === userId
        ? { ...conv, unread_count: 0 }
        : conv
    )
    set({ conversations: updatedConversations })
    logger.debug('chatStore:clearUnreadCount', `Cleared unread count for user ${userId}`)
  },
  }
})
