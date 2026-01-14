/**
 * User Service Types
 * 
 * Shared type definitions for user and conversation services.
 * Single source of truth for user-related types.
 */

import type { Profile } from './profile.service'
import type { RelationshipStatus } from '@/features/profile/types/profile.types'

// ===== Conversation Types =====

export interface ConversationProfile extends Omit<Profile, 'relationship_status'> {
    last_message: string | null
    last_message_time: string | null
    unread_count: number
    relationship_status?: RelationshipStatus | string
    is_archived?: boolean
    chat_deleted_at?: string | null
    is_group?: boolean
    member_count?: number
    name?: string
    description?: string | null
}

/**
 * Unified conversation type returned by get_unified_conversations RPC
 * Supports both DM and Group conversations in a single list
 */
export interface UnifiedConversation {
    id: string
    name: string
    avatar_url: string | null
    description: string | null
    is_group: boolean
    is_online: boolean
    last_message: string | null
    last_message_time: string | null
    last_message_sender_id: string | null
    unread_count: number
    is_archived: boolean
    is_muted: boolean
    member_count: number
    email: string | null
    username: string | null
    status: string | null
    relationship_status: string
}

// ===== Response Types =====

export interface GetUsersResponse {
    success: boolean
    error?: string
    data?: Profile[]
}

export interface GetConversationsResponse {
    success: boolean
    error?: string
    data?: ConversationProfile[]
}

export interface GetUnifiedConversationsResponse {
    success: boolean
    error?: string
    data?: UnifiedConversation[]
}

// ===== Internal RPC Response Types =====

export interface UnifiedConversationRPCResponse {
    id: string
    name: string
    username: string | null
    avatar_url: string | null
    description: string | null
    email: string | null
    status: string | null
    last_seen: string | null
    last_message: string | null
    last_message_time: string | null
    unread_count: number
    relationship_status: string | null
    is_group: boolean
    member_count: number
}

export interface PublicProfileRPCResponse {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    status: string | null  // Bio/status text for preview
    has_relationship: boolean
    relationship_status: string | null
    is_pending_outgoing: boolean
    is_pending_incoming: boolean
    am_i_following: boolean
    is_following_me: boolean
}
