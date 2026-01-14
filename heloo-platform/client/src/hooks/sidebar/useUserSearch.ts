/**
 * User Search Hook
 * 
 * Responsibility: Manages NEW USER SEARCH (discovery) with debouncing
 * Layer: Hook (Logic)
 * 
 * NOTE: This hook is for searching ALL platform users (user discovery).
 * It makes API calls to find new people to connect with.
 * 
 * For local sidebar filtering (existing conversations + contacts),
 * see useSidebar.ts which uses client-side filtering.
 * 
 * For the dedicated Search Page, see pages/search/useSearchPage.ts
 * which has its own implementation with race condition protection.
 * 
 * Features:
 * - Debounced search (300ms)
 * - Clear search
 * - Search state management
 * 
 * @deprecated Consider using useSearchPage for new implementations
 */

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/lib/services/profile.service'

const SEARCH_DEBOUNCE_MS = 300

export interface UseUserSearchReturn {
    searchQuery: string
    setSearchQuery: (value: string) => void
    handleSearchChange: (value: string) => void
    isSearching: boolean
    searchResults: Profile[]
    searchLoading: boolean
    clearUserSearch: () => void
}

export const useUserSearch = (): UseUserSearchReturn => {
    const { user } = useAuthStore()
    const { searchResults, searchLoading, isSearching, searchNewUsers, clearSearch } = useChatStore()
    const [searchQuery, setSearchQuery] = useState('')
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        // Debounce search
        if (value.trim() && user?.id) {
            searchTimeoutRef.current = setTimeout(() => {
                searchNewUsers(value, user.id)
            }, SEARCH_DEBOUNCE_MS)
        } else if (!value.trim()) {
            clearSearch()
        }
    }

    const clearUserSearch = () => {
        setSearchQuery('')
        clearSearch()
    }

    return {
        searchQuery,
        setSearchQuery,
        handleSearchChange,
        isSearching,
        searchResults,
        searchLoading,
        clearUserSearch,
    }
}
