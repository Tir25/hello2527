/**
 * Search Storage Utilities
 * 
 * Responsibility: localStorage operations for search feature
 * Layer: Utility
 * 
 * Handles recent searches and recently viewed profiles
 * with minimal data storage to prevent localStorage bloat
 */

import { logger } from '@/lib/logger'
import type { Profile } from '@/lib/services/profile.service'
import type {
    RecentSearch,
    RecentlyViewed,
    RecentProfileData,
} from './types'
import {
    RECENT_SEARCHES_KEY,
    RECENT_VIEWED_KEY,
    MAX_RECENT_ITEMS,
} from './types'

/**
 * Extract minimal profile data for storage
 * Reduces storage from ~500 bytes to ~100 bytes per profile
 */
export const extractMinimalProfile = (profile: Profile): RecentProfileData => ({
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
})

/**
 * Load recent searches from localStorage
 */
export const loadRecentSearches = (): RecentSearch[] => {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        logger.error('searchStorage:loadRecentSearches', 'Failed to load', error)
    }
    return []
}

/**
 * Load recently viewed profiles from localStorage
 */
export const loadRecentlyViewed = (): RecentlyViewed[] => {
    try {
        const stored = localStorage.getItem(RECENT_VIEWED_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        logger.error('searchStorage:loadRecentlyViewed', 'Failed to load', error)
    }
    return []
}

/**
 * Save a recent search query
 * Deduplicates and limits to MAX_RECENT_ITEMS
 */
export const saveRecentSearch = (
    query: string,
    currentSearches: RecentSearch[]
): RecentSearch[] => {
    const trimmed = query.trim()
    if (!trimmed) return currentSearches

    try {
        const newSearches: RecentSearch[] = [
            { query: trimmed, timestamp: Date.now() },
            ...currentSearches.filter(
                (s) => s.query.toLowerCase() !== trimmed.toLowerCase()
            ),
        ].slice(0, MAX_RECENT_ITEMS)

        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches))
        return newSearches
    } catch (error) {
        logger.error('searchStorage:saveRecentSearch', 'Failed to save', error)
        return currentSearches
    }
}

/**
 * Save a recently viewed profile
 * Stores minimal data to prevent localStorage bloat
 */
export const saveRecentlyViewed = (
    profile: Profile,
    currentViewed: RecentlyViewed[]
): RecentlyViewed[] => {
    try {
        const minimalProfile = extractMinimalProfile(profile)
        const newViewed: RecentlyViewed[] = [
            { userId: profile.id, profile: minimalProfile, timestamp: Date.now() },
            ...currentViewed.filter((v) => v.userId !== profile.id),
        ].slice(0, MAX_RECENT_ITEMS)

        localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(newViewed))
        return newViewed
    } catch (error) {
        logger.error('searchStorage:saveRecentlyViewed', 'Failed to save', error)
        return currentViewed
    }
}

/**
 * Remove a recent search query
 */
export const removeRecentSearch = (
    query: string,
    currentSearches: RecentSearch[]
): RecentSearch[] => {
    try {
        const updated = currentSearches.filter(
            (s) => s.query.toLowerCase() !== query.toLowerCase()
        )
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
        return updated
    } catch (error) {
        logger.error('searchStorage:removeRecentSearch', 'Failed to remove', error)
        return currentSearches
    }
}
