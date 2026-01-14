/**
 * Search Page Types
 * 
 * Responsibility: Type definitions for search page feature
 * Layer: Types
 * 
 * Single source of truth for search-related types
 */

import type { Profile } from '@/lib/services/profile.service'

/**
 * Minimal profile data for localStorage storage
 * Stores only what's needed for display, reducing localStorage bloat
 */
export interface RecentProfileData {
    id: string
    fullName: string | null
    username: string | null
    avatarUrl: string | null
}

/**
 * Recent search entry
 */
export interface RecentSearch {
    query: string
    timestamp: number
}

/**
 * Recently viewed profile entry
 */
export interface RecentlyViewed {
    userId: string
    profile: RecentProfileData
    timestamp: number
}

/**
 * Extended Profile with relationship flags from search RPC
 * Uses the existing Profile type fields - no local duplication
 */
export type SearchProfile = Profile & {
    isPendingOutgoing?: boolean
    isPendingIncoming?: boolean
    amIFollowing?: boolean
    isFollowingMe?: boolean
}

/**
 * Search page state interface
 */
export interface SearchPageState {
    searchQuery: string
    searchResults: Profile[]
    loading: boolean
    recentSearches: RecentSearch[]
    recentlyViewed: RecentlyViewed[]
}

/**
 * Constants
 */
export const RECENT_SEARCHES_KEY = 'heloo_recent_searches'
export const RECENT_VIEWED_KEY = 'heloo_recently_viewed'
export const MAX_RECENT_ITEMS = 10
export const SEARCH_DEBOUNCE_MS = 300
