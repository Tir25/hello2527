/**
 * Search History Types
 * 
 * Type definitions and constants for search history service.
 * @module lib/services/searchHistory/types
 */

export interface SearchHistoryItem {
    id: string
    query: string
    searched_at: string
}

export interface PrivacySettings {
    saveSearchHistory: boolean
}

export interface SearchHistoryResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

// Constants
export const CACHE_KEY = 'heloo_search_history_cache'
export const PRIVACY_CACHE_KEY = 'heloo_privacy_settings_cache'
export const MAX_CACHE_ITEMS = 20
