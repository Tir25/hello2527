/**
 * RequestBanner Types
 * 
 * Type definitions for the request banner components.
 * @module components/chat/RequestBanner/types
 */

export type RelationshipStatus = 'pending' | 'blocked' | 'none'

export interface RequestBannerProps {
    userName: string
    userId: string
    relationshipStatus: RelationshipStatus
    isRequester: boolean
    /** True if current user is the one who blocked */
    isBlocker?: boolean
    relationshipId?: string
    onStatusChange: () => void
}

export interface BannerActionState {
    loading: boolean
    declineLoading: boolean
    blockLoading: boolean
    followLoading: boolean
}
