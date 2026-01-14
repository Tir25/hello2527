/**
 * Relationship Service Types
 * 
 * Shared types for relationship operations.
 * @module features/profile/services/relationship/types
 */

import type { RelationshipResponse, RelationshipStatus } from '../../types/profile.types'

export type { RelationshipResponse, RelationshipStatus }

export interface RelationshipDetails {
    id: string
    requester_id: string
    recipient_id: string
    status: string
}

export interface IncomingRequest {
    id: string
    relationship_id: string
    requester_id: string
    recipient_id: string
    created_at: string
    profile: {
        id: string
        full_name: string | null
        username: string | null
        avatar_url: string | null
        email: string
    }
}

export interface IncomingRequestsResponse {
    success: boolean
    data?: IncomingRequest[]
    error?: string
}

export interface ConnectionProfile {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    email: string
    status: string | null
    last_seen: string | null
}

export interface ConnectionsResponse {
    success: boolean
    data?: ConnectionProfile[]
    error?: string
}
