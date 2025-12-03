import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/lib/services/profile.service'

/**
 * User Search Hook
 * 
 * Responsibility: Manages search functionality with debouncing
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Debounced search (300ms)
 * - Clear search
 * - Search state management
 */

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
