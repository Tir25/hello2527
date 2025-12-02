export interface User {
    id: string
    email: string
    username: string
    avatar?: string
    status?: 'online' | 'offline' | 'away'
    createdAt: string
    updatedAt: string
}

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
