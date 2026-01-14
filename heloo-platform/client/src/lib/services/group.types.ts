/**
 * Group Service Types
 * 
 * Shared type definitions for all group service modules.
 * Single source of truth for group-related types.
 */

import type { Profile } from './profile.service'

// ===== Core Types =====

export interface Group {
    id: string
    name: string
    description: string | null
    avatar_url: string | null
    created_by: string
    created_at: string
}

export interface GroupMember {
    group_id: string
    user_id: string
    role: 'admin' | 'member'
    joined_at: string
    profile?: Profile
}

export interface CreateGroupRequest {
    name: string
    description?: string
    memberIds: string[]
}

// ===== Response Type =====

export interface GroupServiceResponse<T> {
    success: boolean
    error?: string
    data?: T
}
