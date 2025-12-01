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

// Database message interface matching Supabase messages table schema
export interface DatabaseMessage {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    is_read: boolean
}

export interface ChatRoom {
    id: string
    name?: string
    type: 'direct' | 'group'
    participants: User[]
    lastMessage?: Message
    createdAt: string
    updatedAt: string
}
