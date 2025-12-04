export interface DatabaseMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  status: 'sent' | 'delivered' | 'seen'
  delivered_at?: string | null
  seen_at?: string | null
  media_url?: string | null
  media_type?: 'image' | 'video' | 'audio' | 'document' | null
  file_name?: string | null
  // Legacy field - kept for backward compatibility but should not be used
  is_read?: boolean
}

export interface DatabaseProfile {
  id: string
  user_id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  phone: string | null
  status: string | null
  last_seen: string | null
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

