export interface DatabaseMessage {
  id: string
  sender_id: string
  receiver_id?: string | null  // Nullable: NULL for group messages
  group_id?: string | null     // NEW: Set for group messages, NULL for DMs
  content: string
  created_at: string
  status: 'sent' | 'delivered' | 'seen'
  delivered_at?: string | null
  seen_at?: string | null
  media_url?: string | null
  media_type?: 'image' | 'video' | 'audio' | 'document' | null
  file_name?: string | null
  // Message management fields
  is_edited?: boolean
  is_unsent?: boolean
  deleted_for?: string[]
  // Pin fields
  is_pinned?: boolean
  pinned_at?: string | null
  pinned_by?: string | null
  // Mentions
  mentions?: string[]
  // Reply/Quote fields
  reply_to_id?: string | null
  reply_to?: ReplyToMessage | null  // Populated for display
  // Rich message payload for story mentions, replies, etc.
  payload?: MessagePayload | null
  // Legacy field - kept for backward compatibility but should not be used
  is_read?: boolean
  // Group message sender info (populated by get_group_messages RPC)
  sender_name?: string | null
  sender_avatar?: string | null
  sender_username?: string | null
}

// Minimal message info for reply preview
export interface ReplyToMessage {
  id: string
  content: string
  sender_id: string
  sender_name?: string | null
  media_type?: 'image' | 'video' | 'audio' | 'document' | null
}

// Rich message payload types
export type MessagePayload = StoryMentionPayload | StoryReplyPayload

export interface StoryMentionPayload {
  type: 'story_mention'
  storyId: string
  storyOwnerId: string
  thumbnailUrl: string | null
  mediaUrl: string
  expiresAt: string
  audienceType: 'public' | 'close_friends'
}

export interface StoryReplyPayload {
  type: 'story_reply'
  storyId: string
  storyOwnerId: string
  thumbnailUrl: string | null
  mediaUrl: string
  expiresAt: string
  replyText: string
}

// Type guard for story mention payload
export function isStoryMentionPayload(p: unknown): p is StoryMentionPayload {
  return typeof p === 'object' && p !== null && (p as StoryMentionPayload).type === 'story_mention'
}

// Type guard for story reply payload
export function isStoryReplyPayload(p: unknown): p is StoryReplyPayload {
  return typeof p === 'object' && p !== null && (p as StoryReplyPayload).type === 'story_reply'
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
