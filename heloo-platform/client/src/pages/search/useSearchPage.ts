/**
 * Search Page Hook
 * 
 * Responsibility: Search page coordination and state management
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Debounced search with race condition protection
 * - Recently viewed profiles management
 * - Navigation handlers
 * 
 * Delegates to:
 * - useSearchHistory: Cloud-synced search history
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '@/lib/services/user.service'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearchHistory } from './hooks/useSearchHistory'
import type { SearchHistoryItem } from '@/lib/services/searchHistory'
import type { Profile } from '@/lib/services/profile.service'
import type { RecentlyViewed } from './types'
import { SEARCH_DEBOUNCE_MS } from './types'
import { loadRecentlyViewed, saveRecentlyViewed } from './searchStorage'

export interface UseSearchPageReturn {
    // Search state
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchResults: Profile[]
    loading: boolean

    // Recent items
    recentSearches: SearchHistoryItem[]
    recentSearchesLoading: boolean
    recentlyViewed: RecentlyViewed[]

    // Actions
    handleQuickSearch: (query: string) => void
    handleClearRecentSearch: (query: string) => void
    handleClearAllHistory: () => void
    handleViewProfile: (profile: Profile) => void
    handleMessage: (profile: Profile) => void
    commitSearch: () => void

    // Computed
    showSearchResults: boolean
    suggestedUsers: Profile[]

    // Ref for auto-focus
    searchInputRef: React.RefObject<HTMLInputElement | null>
}

export const useSearchPage = (): UseSearchPageReturn => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { setSelectedUser } = useChatStore()
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Delegate history management to dedicated hook
    const {
        recentSearches,
        loading: recentSearchesLoading,
        saveSearch,
        deleteSearch,
        clearAllHistory,
    } = useSearchHistory()

    // Local state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewed[]>([])

    // Debounced search query
    const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS)

    // Race condition protection
    const requestVersionRef = useRef(0)

    // Auto-focus on mount
    useEffect(() => {
        searchInputRef.current?.focus()
    }, [])

    // Load recently viewed from localStorage
    useEffect(() => {
        setRecentlyViewed(loadRecentlyViewed())
    }, [])

    // Perform search when debounced query changes
    useEffect(() => {
        const performSearch = async () => {
            if (!user?.id) return

            const trimmed = debouncedQuery.trim()
            if (!trimmed) {
                setSearchResults([])
                return
            }

            const currentVersion = ++requestVersionRef.current

            try {
                setLoading(true)
                const result = await userService.searchUsers(trimmed, user.id)

                // Race condition protection
                if (currentVersion !== requestVersionRef.current) return

                if (!result.success) {
                    toast.error(result.error || 'Failed to search users')
                    setSearchResults([])
                    return
                }

                setSearchResults(result.data || [])

                // NOTE: We do NOT save to history here - only on explicit user actions
                // This prevents partial queries ("ni") from cluttering history

                logger.info('useSearchPage:search', `Found ${result.data?.length || 0} users`)
            } catch (error) {
                if (currentVersion === requestVersionRef.current) {
                    logger.error('useSearchPage:search', 'Unexpected error', error)
                    toast.error('An unexpected error occurred')
                    setSearchResults([])
                }
            } finally {
                if (currentVersion === requestVersionRef.current) {
                    setLoading(false)
                }
            }
        }

        performSearch()
    }, [debouncedQuery, user?.id, saveSearch])

    // Quick search from recent searches
    const handleQuickSearch = useCallback((query: string) => {
        setSearchQuery(query)
        searchInputRef.current?.focus()
        // Save to history since this is an explicit action
        saveSearch(query)
    }, [saveSearch])

    // Commit search (called on Enter key) - saves to history
    const commitSearch = useCallback(() => {
        const trimmed = searchQuery.trim()
        if (trimmed.length > 0) {
            saveSearch(trimmed)
        }
    }, [searchQuery, saveSearch])

    // View profile and save to recently viewed
    const handleViewProfile = useCallback((profile: Profile) => {
        // Save search query to history when clicking a result
        const trimmed = searchQuery.trim()
        if (trimmed.length > 0) {
            saveSearch(trimmed)
        }
        setRecentlyViewed((prev) => saveRecentlyViewed(profile, prev))
        // Use username for clean URLs, fallback to ID
        navigate(`/profile/${profile.username || profile.id}`)
    }, [navigate, searchQuery, saveSearch])

    // Start chat with user
    const handleMessage = useCallback((profile: Profile) => {
        setRecentlyViewed((prev) => saveRecentlyViewed(profile, prev))
        setSelectedUser(profile)
        navigate('/')
    }, [navigate, setSelectedUser])

    // Computed values
    const showSearchResults = searchQuery.trim().length > 0

    const suggestedUsers: Profile[] = recentlyViewed
        .filter((v) => v.userId !== user?.id)
        .slice(0, 6)
        .map((v) => ({
            id: v.userId,
            email: '',
            full_name: v.profile.fullName,
            username: v.profile.username,
            avatar_url: v.profile.avatarUrl,
            phone: null,
            status: null,
            last_seen: null,
            created_at: null,
        }))

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        loading,
        recentSearches,
        recentSearchesLoading,
        recentlyViewed,
        handleQuickSearch,
        handleClearRecentSearch: deleteSearch,
        handleClearAllHistory: clearAllHistory,
        handleViewProfile,
        handleMessage,
        commitSearch,
        showSearchResults,
        suggestedUsers,
        searchInputRef,
    }
}
