/**
 * Presence Slice
 * 
 * Responsibility: Track online/offline status and last_seen
 * Layer: Store Slice
 * 
 * Max lines: ~60
 */

import type { StateCreator } from 'zustand'
import { logger } from '@/lib/logger'
import type { ChatState, PresenceSlice } from './types'

export const createPresenceSlice: StateCreator<
    ChatState,
    [],
    [],
    PresenceSlice
> = (set, get) => ({
    // State
    onlineUsers: new Set<string>(),
    userLastSeen: new Map<string, string>(),

    // Actions
    setUserOnline: (userId: string) => {
        const { onlineUsers, userLastSeen } = get()
        const newOnlineUsers = new Set(onlineUsers)
        newOnlineUsers.add(userId)
        // Remove from last seen when user comes online
        const newLastSeen = new Map(userLastSeen)
        newLastSeen.delete(userId)
        set({ onlineUsers: newOnlineUsers, userLastSeen: newLastSeen })
        logger.info('presenceSlice:setUserOnline', `User ${userId} is now online`)
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
        logger.info('presenceSlice:setUserOffline', `User ${userId} is now offline`, { lastSeen })
    },

    isUserOnline: (userId: string) => {
        return get().onlineUsers.has(userId)
    },

    getUserLastSeen: (userId: string) => {
        return get().userLastSeen.get(userId) || null
    },
})
