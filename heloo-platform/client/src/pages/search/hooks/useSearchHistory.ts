/**
 * Search History Hook
 * 
 * Responsibility: Cloud-synced search history management
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Load search history from Supabase
 * - Save searches with optimistic updates
 * - Delete individual searches
 * - Clear all history
 */

import { useState, useEffect, useCallback } from 'react'
import { searchHistoryService, type SearchHistoryItem } from '@/lib/services/searchHistory'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'

export interface UseSearchHistoryReturn {
    recentSearches: SearchHistoryItem[]
    loading: boolean
    saveSearch: (query: string) => Promise<void>
    deleteSearch: (query: string) => Promise<void>
    clearAllHistory: () => Promise<void>
    refreshHistory: () => Promise<void>
}

export const useSearchHistory = (): UseSearchHistoryReturn => {
    const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    // Load history on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const result = await searchHistoryService.getSearchHistory(10)
                if (result.data) {
                    setRecentSearches(result.data)
                }
                // Migrate localStorage history to cloud (one-time)
                await searchHistoryService.migrateLocalStorageToCloud()
            } catch (error) {
                logger.error('useSearchHistory:loadData', 'Failed to load search history', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    // Refresh history from cloud
    const refreshHistory = useCallback(async () => {
        try {
            const result = await searchHistoryService.getSearchHistory(10)
            if (result.data) {
                setRecentSearches(result.data)
            }
        } catch (error) {
            logger.error('useSearchHistory:refreshHistory', 'Failed to refresh', error)
        }
    }, [])

    // Save a search to cloud
    const saveSearch = useCallback(async (query: string) => {
        try {
            const result = await searchHistoryService.saveSearch(query)
            if (result.success) {
                await refreshHistory()
            }
        } catch (error) {
            logger.error('useSearchHistory:saveSearch', 'Failed to save search', error)
        }
    }, [refreshHistory])

    // Delete a single search (optimistic update)
    const deleteSearch = useCallback(async (query: string) => {
        // Optimistic update
        setRecentSearches((prev) => prev.filter((item) => item.query !== query))

        const result = await searchHistoryService.deleteSearch(query)
        if (!result.success) {
            logger.error('useSearchHistory:deleteSearch', 'Failed to delete', result.error)
            // Restore on failure
            await refreshHistory()
        }
    }, [refreshHistory])

    // Clear all history (optimistic update)
    const clearAllHistory = useCallback(async () => {
        // Optimistic update
        setRecentSearches([])

        const result = await searchHistoryService.clearSearchHistory()
        if (result.success) {
            toast.success('Search history cleared')
        } else {
            logger.error('useSearchHistory:clearAllHistory', 'Failed to clear', result.error)
            toast.error('Failed to clear history')
            // Restore on failure
            await refreshHistory()
        }
    }, [refreshHistory])

    return {
        recentSearches,
        loading,
        saveSearch,
        deleteSearch,
        clearAllHistory,
        refreshHistory,
    }
}
