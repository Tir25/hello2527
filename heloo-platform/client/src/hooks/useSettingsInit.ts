/**
 * Settings Initialization Hook
 * 
 * Responsibility: Load conversation settings (muted, deleted, archived) on app start
 * Layer: Hook (Initialization)
 * 
 * Should be called once in DashboardLayout alongside useGlobalMessageListener.
 * Fetches settings when user is authenticated and tracks initialization state.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'

/**
 * Initializes conversation settings for the authenticated user.
 * This enables features like:
 * - isChatDeleted() for soft-delete filtering
 * - isUserMuted() for notification muting
 * - Archived conversation tracking
 */
export const useSettingsInit = () => {
    const { user } = useAuthStore()
    const { fetchConversationSettings, settingsLoaded } = useChatStore()
    const initializedForUserRef = useRef<string | null>(null)

    useEffect(() => {
        const userId = user?.id

        // Skip if no user or already initialized for this user
        if (!userId || initializedForUserRef.current === userId) {
            return
        }

        // Skip if already loaded (from a previous mount)
        if (settingsLoaded && initializedForUserRef.current === userId) {
            return
        }

        initializedForUserRef.current = userId

        logger.info('useSettingsInit', 'Initializing conversation settings for user')
        void fetchConversationSettings()
    }, [user?.id, fetchConversationSettings, settingsLoaded])
}
