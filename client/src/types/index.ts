export interface User {
    id: string
    email: string
    username: string
    avatar?: string
    status?: 'online' | 'offline' | 'away'
    createdAt: string
    updatedAt: string
}

/**
 * @deprecated This interface is outdated and does not match the current database schema.
 * Use `DatabaseMessage` from './database.types' instead, which includes:
 * - media_type: 'image' | 'video' | 'audio' | 'document' | null
 * - media_url: string | null
 * 
 * This interface is kept for backward compatibility only.
 * It will be removed in a future version.
 */
export interface Message {
    id: string
    content: string
    senderId: string
    receiverId: string
    roomId?: string
    timestamp: string
    read: boolean
    type: 'text' | 'image' | 'file'
}

// Re-export database types
export type { DatabaseMessage, DatabaseProfile, DatabaseConversation } from './database.types'

export interface ChatRoom {
    id: string
    name?: string
    type: 'direct' | 'group'
    participants: User[]
    lastMessage?: Message
    createdAt: string
    updatedAt: string
}
