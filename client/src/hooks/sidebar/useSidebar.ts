import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import type { Profile } from '@/lib/services/profile.service'
import { useUserSearch } from './useUserSearch'
import { useConversationList } from './useConversationList'

/**
 * Sidebar Hook
 * 
 * Responsibility: Main orchestrator for sidebar logic
 * Layer: Hook (Logic)
 * 
 * Combines conversation list and search functionality
 */

export interface UseSidebarReturn {
    // User selection
    selectedUser: Profile | null
    handleUserClick: (user: Profile) => void

    // Search
    searchQuery: string
    handleSearchChange: (value: string) => void
    showSearchResults: boolean
    clearUserSearch: () => void

    // Display list (conversations or search results)
    displayList: Profile[]
    isLoading: boolean
    error: string | null

    // Retry
    retryFetch: () => Promise<void>
}

export const useSidebar = (): UseSidebarReturn => {
    const { selectedUser, setSelectedUser } = useChatStore()

    const {
        searchQuery,
        handleSearchChange,
        isSearching,
        searchResults,
        searchLoading,
        clearUserSearch,
    } = useUserSearch()

    const { conversations, conversationsLoading, conversationsError, fetchConversations } =
        useConversationList()

    const handleUserClick = (clickedUser: Profile) => {
        setSelectedUser(clickedUser)
        logger.info('useSidebar:handleUserClick', `Selected user: ${clickedUser.id}`)

        // Clear search if user was found via search
        if (isSearching) {
            clearUserSearch()
        }
    }

    const showSearchResults = searchQuery.trim().length > 0
    const displayList = showSearchResults ? searchResults : conversations
    const isLoading = showSearchResults ? searchLoading : conversationsLoading
    const error = showSearchResults ? null : conversationsError

    return {
        selectedUser,
        handleUserClick,
        searchQuery,
        handleSearchChange,
        showSearchResults,
        clearUserSearch,
        displayList,
        isLoading,
        error,
        retryFetch: fetchConversations,
    }
}
