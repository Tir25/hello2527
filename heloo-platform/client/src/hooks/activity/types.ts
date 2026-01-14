/**
 * Activity Request Types
 * 
 * Shared types for activity/request hooks
 */

import type { Profile } from '@/features/profile/types/profile.types'

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

export interface ActivityState {
    requests: IncomingRequest[]
    loading: boolean
    processingIds: Set<string>
    acceptedRequests: IncomingRequest[]
    followingBackIds: Set<string>
}

export interface ActivityActions {
    handleAccept: (request: IncomingRequest) => Promise<void>
    handleDecline: (request: IncomingRequest) => Promise<void>
    handleFollowBack: (request: IncomingRequest) => Promise<void>
    handleDismissFollowBack: (requesterId: string) => void
    refetch: () => Promise<void>
}

export interface ActivityHelpers {
    getDisplayName: (request: IncomingRequest) => string
    getProfileFromRequest: (request: IncomingRequest) => Profile
}

export interface UseActivityRequestsResult extends ActivityState, ActivityActions, ActivityHelpers { }
