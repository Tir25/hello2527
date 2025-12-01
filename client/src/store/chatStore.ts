import { create } from 'zustand'
import type { Profile } from '@/lib/services/profile.service'
import type { DatabaseMessage } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatState {
  selectedUser: Profile | null
  users: Profile[]
  messages: DatabaseMessage[]
  loading: boolean
  error: string | null
  channel: RealtimeChannel | null
  setSelectedUser: (user: Profile | null) => void
  setUsers: (users: Profile[]) => void
  setMessages: (messages: DatabaseMessage[]) => void
  addMessage: (message: DatabaseMessage) => void
  clearChat: () => void
  fetchMessages: (receiverId: string, currentUserId: string) => Promise<void>
  sendMessage: (content: string, receiverId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>
  subscribeToMessages: (currentUserId: string) => void
  unsubscribeFromMessages: () => void
}

/**
 * Chat store for managing selected user, user list, and messages state
 * Includes real-time subscription to Supabase Realtime for instant updates
 */
export const useChatStore = create<ChatState>((set, get) => ({
  selectedUser: null,
  users: [],
  messages: [],
  loading: false,
  error: null,
  channel: null,

  setSelectedUser: (user: Profile | null) => {
    set({ selectedUser: user })
    // Clear messages when selecting a new user
    if (user === null) {
      set({ messages: [] })
      get().unsubscribeFromMessages()
    }
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
      messages: [],
      error: null,
      loading: false
    })
  },

  fetchMessages: async (receiverId: string, currentUserId: string) => {
    try {
      set({ loading: true, error: null })
      
      // PRODUCTION FIX: Single efficient query using OR condition
      // This replaces the previous double-query approach for better performance
      // Uses the composite index messages_conversation_idx for optimal performance
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('chatStore:fetchMessages', 'Failed to fetch messages', error)
        const errorMessage = error.message || 'Failed to fetch messages'
        set({ error: errorMessage, loading: false })
        toast.error('Unable to load messages. Please try again.')
        return
      }

      const messages = (data || []) as DatabaseMessage[]
      set({ messages, loading: false })
      logger.info('chatStore:fetchMessages', `Fetched ${messages.length} messages in single query`)
    } catch (err) {
      logger.error('chatStore:fetchMessages', 'Unexpected error fetching messages', err)
      set({ error: 'An unexpected error occurred', loading: false })
    }
  },

  sendMessage: async (content: string, receiverId: string, currentUserId: string) => {
    try {
      // Optimistically add message to UI for instant feedback
      const optimisticMessage: DatabaseMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
      }
      
      // Add optimistic message immediately
      get().addMessage(optimisticMessage)

      // PRODUCTION FIX: Insert message - data not needed as subscription will handle adding it
      // We only need to check for errors, not use the returned data
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: content.trim(),
        })

      if (error) {
        logger.error('chatStore:sendMessage', 'Failed to send message', error)
        // PRODUCTION FIX: Remove optimistic message on error
        const { messages } = get()
        set({ 
          messages: messages.filter(m => m.id !== optimisticMessage.id),
          error: error.message || 'Failed to send message'
        })
        return { success: false, error: error.message || 'Failed to send message' }
      }

      // PRODUCTION FIX: Let the real-time subscription handle adding the real message
      // This prevents duplicate messages from manual addition + subscription
      // Only remove the optimistic message - subscription will add the real one
      const { messages } = get()
      set({ 
        messages: messages.filter(m => m.id !== optimisticMessage.id)
      })

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

  subscribeToMessages: (currentUserId: string) => {
    // Unsubscribe from any existing channel
    get().unsubscribeFromMessages()

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as DatabaseMessage
          const { selectedUser, messages } = get()

          // Only add message if it belongs to the current conversation
          if (
            selectedUser &&
            ((newMessage.sender_id === currentUserId && newMessage.receiver_id === selectedUser.id) ||
             (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUserId))
          ) {
            // Avoid duplicates
            if (!messages.find((m) => m.id === newMessage.id)) {
              logger.info('chatStore:subscribeToMessages', 'New message received via subscription')
              get().addMessage(newMessage)
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('chatStore:subscribeToMessages', 'Successfully subscribed to messages channel')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('chatStore:subscribeToMessages', 'Channel subscription error')
          set({ error: 'Failed to subscribe to real-time updates' })
        }
      })

    set({ channel })
  },

  unsubscribeFromMessages: () => {
    const { channel } = get()
    if (channel) {
      // PRODUCTION FIX: Properly unsubscribe and verify channel removal
      // Use promise-based removal to ensure cleanup completes
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
}))

