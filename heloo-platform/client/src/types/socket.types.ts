import type { DatabaseMessage } from '@/types/database.types'

export interface UserStatusEvent {
    userId: string
    status: 'online' | 'offline'
    last_seen?: string
}

export interface InitialOnlineUsersEvent {
    userIds: string[]
}

export interface UserTypingEvent {
    userId: string
    receiverId?: string
    groupId?: string
    isTyping: boolean
}

export interface ReactionUpdateEvent {
    messageId: string
    conversationId: string
    emoji: string
    type: 'add' | 'remove'
    userId: string
}

// Use full DatabaseMessage type for socket messages
// Server transmits the complete message object
export type MessageReceiveEvent = DatabaseMessage
