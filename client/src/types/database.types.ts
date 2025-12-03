export interface DatabaseMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  media_url?: string | null
  media_type?: 'image' | 'video' | 'audio' | 'document' | null
}

export interface DatabaseProfile {
  id: string
  user_id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseConversation {
  id: string
  user_id: string
  other_user_id: string
  last_message: string | null
  last_message_time: string | null
  unread_count: number
}

