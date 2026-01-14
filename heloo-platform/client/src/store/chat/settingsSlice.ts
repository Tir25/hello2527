/**
 * Settings Slice
 * 
 * Responsibility: Manage conversation settings (muted, deleted, archived)
 * and global unread count
 * Layer: Store Slice
 * 
 * Max lines: ~150
 */

import type { StateCreator } from 'zustand'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import type { ChatState, SettingsSlice, ConversationSettings } from './types'

export const createSettingsSlice: StateCreator<
    ChatState,
    [],
    [],
    SettingsSlice
> = (set, get) => ({
    // State
    settingsMap: new Map<string, ConversationSettings>(),
    settingsLoaded: false,
    globalUnreadCount: 0,

    // Actions
    fetchConversationSettings: async () => {
        try {
            const { data, error } = await supabase.rpc('get_my_conversation_settings')

            if (error) {
                logger.error('settingsSlice:fetchConversationSettings', 'Failed to fetch settings', error)
                return
            }

            const newMap = new Map<string, ConversationSettings>()
            if (data && Array.isArray(data)) {
                data.forEach((setting: ConversationSettings) => {
                    newMap.set(setting.partner_id, setting)
                })
            }

            set({ settingsMap: newMap, settingsLoaded: true })
            logger.info('settingsSlice:fetchConversationSettings', `Loaded ${newMap.size} conversation settings`)
        } catch (error) {
            logger.error('settingsSlice:fetchConversationSettings', 'Unexpected error', error)
        }
    },

    fetchGlobalUnreadCount: async () => {
        try {
            const { data, error } = await supabase.rpc('get_total_unread_count')

            if (error) {
                logger.error('settingsSlice:fetchGlobalUnreadCount', 'Failed to fetch unread count', error)
                return
            }

            const count = typeof data === 'number' ? data : 0
            set({ globalUnreadCount: count })
            logger.debug('settingsSlice:fetchGlobalUnreadCount', `Global unread count: ${count}`)
        } catch (error) {
            logger.error('settingsSlice:fetchGlobalUnreadCount', 'Unexpected error', error)
        }
    },

    getSettingsForUser: (userId: string) => {
        const { settingsMap } = get()
        return settingsMap.get(userId)
    },

    isUserMuted: (userId: string) => {
        const { settingsMap } = get()
        const settings = settingsMap.get(userId)
        return settings?.is_muted ?? false
    },

    isChatDeleted: (userId: string, messageTime: string) => {
        const { settingsMap } = get()
        const settings = settingsMap.get(userId)

        if (!settings?.chat_deleted_at) {
            return false // No deletion timestamp, message is visible
        }

        // Message is "deleted" if it was created before the deletion timestamp
        const messageDate = new Date(messageTime)
        const deletedDate = new Date(settings.chat_deleted_at)
        return messageDate <= deletedDate
    },

    updateSettingsForUser: (userId: string, partialSettings: Partial<ConversationSettings>) => {
        const { settingsMap } = get()
        const existingSettings = settingsMap.get(userId)

        const updatedSettings: ConversationSettings = {
            partner_id: userId,
            chat_deleted_at: partialSettings.chat_deleted_at ?? existingSettings?.chat_deleted_at ?? null,
            is_archived: partialSettings.is_archived ?? existingSettings?.is_archived ?? false,
            is_muted: partialSettings.is_muted ?? existingSettings?.is_muted ?? false,
        }

        const newMap = new Map(settingsMap)
        newMap.set(userId, updatedSettings)
        set({ settingsMap: newMap })

        logger.debug('settingsSlice:updateSettingsForUser', `Updated settings for ${userId}`, { ...updatedSettings })
    },
})
