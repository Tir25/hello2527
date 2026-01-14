/**
 * Typing Slice
 * 
 * Responsibility: Track typing indicators with user info
 * Layer: Store Slice
 * 
 * Enhanced to store user info (name) for display purposes
 */

import type { StateCreator } from 'zustand'
import { logger } from '@/lib/logger'
import type { ChatState, TypingSlice, TypingUserInfo } from './types'

export const createTypingSlice: StateCreator<
    ChatState,
    [],
    [],
    TypingSlice
> = (set, get) => ({
    // State - Map from userId to user info for name display
    typingUsers: new Set<string>(),
    typingUsersInfo: new Map<string, TypingUserInfo>(),

    // Actions
    setUserTyping: (userId: string, isTyping: boolean, userName?: string) => {
        const { typingUsers, typingUsersInfo } = get()

        // Check if state actually changed before updating
        const currentlyTyping = typingUsers.has(userId)

        // If state hasn't changed, don't update (no-op)
        if (currentlyTyping === isTyping) {
            return
        }

        // Create new collections
        const newTypingUsers = new Set(typingUsers)
        const newTypingUsersInfo = new Map(typingUsersInfo)

        if (isTyping) {
            newTypingUsers.add(userId)
            newTypingUsersInfo.set(userId, {
                userId,
                userName: userName || 'Someone'
            })
        } else {
            newTypingUsers.delete(userId)
            newTypingUsersInfo.delete(userId)
        }

        set({ typingUsers: newTypingUsers, typingUsersInfo: newTypingUsersInfo })
        logger.debug('typingSlice:setUserTyping', `User ${userName || userId} ${isTyping ? 'started' : 'stopped'} typing`)
    },

    isUserTyping: (userId: string) => {
        return get().typingUsers.has(userId)
    },

    getTypingUserNames: () => {
        const { typingUsersInfo } = get()
        return Array.from(typingUsersInfo.values()).map(info => info.userName)
    },
})
