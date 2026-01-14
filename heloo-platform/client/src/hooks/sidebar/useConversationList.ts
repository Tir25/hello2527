import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import type { ConversationProfile } from '@/lib/services/user.service'

/**
 * Conversation List Hook
 * 
 * Responsibility: Manages conversation list fetching with deduplication
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Fetches conversations on mount
 * - Deduplicates rapid fetches (React StrictMode protection)
 * - Prevents redundant API calls
 */

const FETCH_DEDUPE_MS = 500

export interface UseConversationListReturn {
    conversations: ConversationProfile[]
    conversationsLoading: boolean
    conversationsError: string | null
    fetchConversations: () => Promise<void>
}

export const useConversationList = (): UseConversationListReturn => {
    const { user, session } = useAuthStore()
    const { conversations, conversationsLoading, conversationsError, fetchConversations } =
        useChatStore()

    const fetchConversationsRef = useRef<{
        lastFetchTime: number
        userId: string | null
    }>({
        lastFetchTime: 0,
        userId: null,
    })

    // Fetch conversations on mount with deduplication
    useEffect(() => {
        if (!session || !user?.id) {
            return
        }

        // Deduplicate conversation fetches to prevent redundant calls
        // This handles React StrictMode double-mounts and rapid auth state changes
        const now = Date.now()
        const timeSinceLastFetch = now - fetchConversationsRef.current.lastFetchTime
        const isSameUser = fetchConversationsRef.current.userId === user.id
        const isRecentFetch = timeSinceLastFetch < FETCH_DEDUPE_MS

        // Skip if: already loading, or recent fetch for same user
        if (conversationsLoading) {
            logger.info('useConversationList', 'Skipping duplicate fetch - already loading')
            return
        }

        if (isRecentFetch && isSameUser) {
            logger.info('useConversationList', 'Skipping duplicate fetch - recent fetch', {
                timeSinceLastFetch: `${timeSinceLastFetch}ms`,
            })
            return
        }

        // Update ref to track fetch
        fetchConversationsRef.current.lastFetchTime = now
        fetchConversationsRef.current.userId = user.id

        logger.info('useConversationList', 'Fetching conversations for authenticated user')
        void fetchConversations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, user?.id])
    // Note: fetchConversations is intentionally excluded - it's stable from Zustand
    // conversationsLoading is used for deduplication check only

    return {
        conversations,
        conversationsLoading,
        conversationsError,
        fetchConversations,
    }
}
