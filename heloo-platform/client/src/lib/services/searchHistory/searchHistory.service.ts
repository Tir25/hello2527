/**
 * Search History Service
 * 
 * Cloud-synced search history management with offline fallback.
 * @module lib/services/searchHistory
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { SearchHistoryItem, PrivacySettings, SearchHistoryResponse } from './types'
import * as cache from './localCache'

export const searchHistoryService = {
    /**
     * Save a search query to Supabase
     */
    async saveSearch(query: string): Promise<SearchHistoryResponse<boolean>> {
        const trimmed = query.trim()
        if (!trimmed) return { success: true, data: false }

        try {
            const { data, error } = await supabase.rpc('save_search_query', {
                search_query: trimmed,
            })

            if (error) {
                logger.error('searchHistory:saveSearch', 'Failed to save', error)
                cache.saveToLocalCache(trimmed)
                return { success: false, error: error.message }
            }

            logger.debug('searchHistory:saveSearch', `Saved: ${trimmed}`)
            return { success: true, data: !!data }
        } catch (error) {
            logger.error('searchHistory:saveSearch', 'Unexpected error', error)
            cache.saveToLocalCache(trimmed)
            return { success: false, error: 'Failed to save search' }
        }
    },

    /**
     * Get recent search history from Supabase
     */
    async getSearchHistory(limit = 10): Promise<SearchHistoryResponse<SearchHistoryItem[]>> {
        try {
            const { data, error } = await supabase.rpc('get_search_history', {
                result_limit: limit,
            })

            if (error) {
                logger.error('searchHistory:getSearchHistory', 'Failed to fetch', error)
                return { success: false, data: cache.getLocalCache(), error: error.message }
            }

            if (data) cache.setLocalCache(data)
            logger.debug('searchHistory:getSearchHistory', `Fetched ${data?.length || 0} items`)
            return { success: true, data: data || [] }
        } catch (error) {
            logger.error('searchHistory:getSearchHistory', 'Unexpected error', error)
            return { success: false, data: cache.getLocalCache(), error: 'Failed to fetch history' }
        }
    },

    /**
     * Clear all search history
     */
    async clearSearchHistory(): Promise<SearchHistoryResponse<boolean>> {
        try {
            const { error } = await supabase.rpc('clear_search_history')
            if (error) {
                logger.error('searchHistory:clearSearchHistory', 'Failed', error)
                return { success: false, error: error.message }
            }

            cache.clearLocalCache()
            logger.info('searchHistory:clearSearchHistory', 'History cleared')
            return { success: true, data: true }
        } catch (error) {
            logger.error('searchHistory:clearSearchHistory', 'Unexpected error', error)
            return { success: false, error: 'Failed to clear history' }
        }
    },

    /**
     * Delete a single search query
     */
    async deleteSearch(query: string): Promise<SearchHistoryResponse<boolean>> {
        try {
            const { error } = await supabase.rpc('delete_search_query', {
                query_to_delete: query,
            })

            if (error) {
                logger.error('searchHistory:deleteSearch', 'Failed', error)
                return { success: false, error: error.message }
            }

            cache.removeFromLocalCache(query)
            logger.debug('searchHistory:deleteSearch', `Deleted: ${query}`)
            return { success: true, data: true }
        } catch (error) {
            logger.error('searchHistory:deleteSearch', 'Unexpected error', error)
            return { success: false, error: 'Failed to delete search' }
        }
    },

    /**
     * Get privacy settings
     */
    async getPrivacySettings(): Promise<SearchHistoryResponse<PrivacySettings>> {
        try {
            const { data, error } = await supabase.rpc('get_privacy_settings')
            if (error) {
                logger.error('searchHistory:getPrivacySettings', 'Failed', error)
                return { success: false, data: cache.getCachedPrivacySettings(), error: error.message }
            }

            const settings: PrivacySettings = {
                saveSearchHistory: data?.[0]?.save_search_history ?? true,
            }
            cache.cachePrivacySettings(settings)
            return { success: true, data: settings }
        } catch (error) {
            logger.error('searchHistory:getPrivacySettings', 'Unexpected error', error)
            return { success: false, data: cache.getCachedPrivacySettings(), error: 'Failed to fetch' }
        }
    },

    /**
     * Update privacy settings
     */
    async updatePrivacySettings(saveSearchHistory: boolean): Promise<SearchHistoryResponse<boolean>> {
        try {
            const { error } = await supabase.rpc('update_privacy_settings', {
                p_save_search_history: saveSearchHistory,
            })

            if (error) {
                logger.error('searchHistory:updatePrivacySettings', 'Failed', error)
                return { success: false, error: error.message }
            }

            cache.cachePrivacySettings({ saveSearchHistory })
            logger.info('searchHistory:updatePrivacySettings', `Set to: ${saveSearchHistory}`)
            return { success: true, data: true }
        } catch (error) {
            logger.error('searchHistory:updatePrivacySettings', 'Unexpected error', error)
            return { success: false, error: 'Failed to update settings' }
        }
    },

    /**
     * Migrate localStorage history to cloud (one-time)
     */
    async migrateLocalStorageToCloud(): Promise<void> {
        const MIGRATION_KEY = 'heloo_search_history_migrated'
        try {
            if (localStorage.getItem(MIGRATION_KEY)) return

            const oldData = localStorage.getItem('heloo_recent_searches')
            if (oldData) {
                const oldSearches = JSON.parse(oldData) as Array<{ query: string }>
                for (const item of oldSearches) {
                    await this.saveSearch(item.query)
                }
                logger.info('searchHistory:migrate', `Migrated ${oldSearches.length} searches`)
            }
            localStorage.setItem(MIGRATION_KEY, 'true')
        } catch (error) {
            logger.error('searchHistory:migrate', 'Failed', error)
        }
    },
}
