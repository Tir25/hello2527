/**
 * Search History Local Cache
 * 
 * Local storage cache helpers for offline fallback.
 * @module lib/services/searchHistory/localCache
 */

import { logger } from '@/lib/logger'
import type { SearchHistoryItem, PrivacySettings } from './types'
import { CACHE_KEY, PRIVACY_CACHE_KEY, MAX_CACHE_ITEMS } from './types'

/**
 * Save a query to localStorage cache
 */
export function saveToLocalCache(query: string): void {
    try {
        const cached = getLocalCache()
        const existing = cached.findIndex(
            (item) => item.query.toLowerCase() === query.toLowerCase()
        )

        if (existing !== -1) {
            cached[existing].searched_at = new Date().toISOString()
        } else {
            cached.unshift({
                id: crypto.randomUUID(),
                query,
                searched_at: new Date().toISOString(),
            })
        }

        const trimmed = cached.slice(0, MAX_CACHE_ITEMS)
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
    } catch (error) {
        logger.warn('searchHistory:saveToLocalCache', 'Failed', error)
    }
}

/**
 * Get history from localStorage cache
 */
export function getLocalCache(): SearchHistoryItem[] {
    try {
        const stored = localStorage.getItem(CACHE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        logger.warn('searchHistory:getLocalCache', 'Failed to read', error)
    }
    return []
}

/**
 * Set localStorage cache
 */
export function setLocalCache(items: SearchHistoryItem[]): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(items))
    } catch (error) {
        logger.warn('searchHistory:setLocalCache', 'Failed to write', error)
    }
}

/**
 * Clear localStorage cache
 */
export function clearLocalCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY)
    } catch (error) {
        logger.warn('searchHistory:clearLocalCache', 'Failed', error)
    }
}

/**
 * Remove single item from localStorage cache
 */
export function removeFromLocalCache(query: string): void {
    try {
        const cached = getLocalCache()
        const filtered = cached.filter(
            (item) => item.query.toLowerCase() !== query.toLowerCase()
        )
        localStorage.setItem(CACHE_KEY, JSON.stringify(filtered))
    } catch (error) {
        logger.warn('searchHistory:removeFromLocalCache', 'Failed', error)
    }
}

/**
 * Cache privacy settings locally
 */
export function cachePrivacySettings(settings: PrivacySettings): void {
    try {
        localStorage.setItem(PRIVACY_CACHE_KEY, JSON.stringify(settings))
    } catch (error) {
        logger.warn('searchHistory:cachePrivacySettings', 'Failed', error)
    }
}

/**
 * Get cached privacy settings
 */
export function getCachedPrivacySettings(): PrivacySettings {
    try {
        const stored = localStorage.getItem(PRIVACY_CACHE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        logger.warn('searchHistory:getCachedPrivacySettings', 'Failed', error)
    }
    return { saveSearchHistory: true }
}
