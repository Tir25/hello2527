import { useState, useMemo, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useDebounce } from '@/hooks/useDebounce'
import { logger } from '@/lib/logger'
import type { Profile } from '@/lib/services/profile.service'
import type { RelationshipStatus } from '@/features/profile/types/profile.types'
import type { ConversationProfile } from '@/lib/services/user.service'
import { useConversationList } from './useConversationList'

/**
 * Sidebar Hook
 * 
 * Responsibility: Main orchestrator for sidebar logic
 * Layer: Hook (Logic)
 * 
 * Implements local search (no API calls), archive toggle, and universal search
 * that includes contacts (friends) not currently in active conversations.
 */

// Type for merged search results - compatible with both Profile and ConversationProfile
export interface SidebarDisplayItem extends Omit<Profile, 'relationship_status'> {
    _source: 'chat' | 'contact'  // Indicates source for UI grouping
    relationship_status?: RelationshipStatus | string  // Wider type for compatibility
    last_message?: string | null
    last_message_time?: string | null
    unread_count?: number
    is_archived?: boolean
    // Group support
    is_group?: boolean
    name?: string  // Group name (for groups, use this; for DMs, use full_name)
}

export interface UseSidebarReturn {
    // User selection
    selectedUser: Profile | null
    handleUserClick: (user: SidebarDisplayItem | ConversationProfile) => void

    // Local search
    searchQuery: string
    handleSearchChange: (value: string) => void
    showSearchResults: boolean
    clearUserSearch: () => void

    // Archive toggle
    showArchived: boolean
    toggleArchived: () => void
    hasArchivedChats: boolean

    // Display list (filtered conversations + contacts)
    displayList: SidebarDisplayItem[]
    isLoading: boolean
    error: string | null

    // Retry
    retryFetch: () => Promise<void>
}

export const useSidebar = (): UseSidebarReturn => {
    const { selectedUser, setSelectedUser, contacts, contactsLoading, fetchContacts, archivedConversations, fetchArchivedConversations } = useChatStore()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // Debounce for performance
    const [showArchived, setShowArchived] = useState(false)

    const { conversations, conversationsLoading, conversationsError, fetchConversations } =
        useConversationList()

    // Fetch contacts on mount (background fetch for universal search)
    useEffect(() => {
        fetchContacts()
        // Also fetch archived conversations to know if there are any (for button visibility)
        fetchArchivedConversations()
    }, [fetchContacts, fetchArchivedConversations])

    // Re-fetch archived conversations when toggling to archived view
    useEffect(() => {
        if (showArchived) {
            fetchArchivedConversations()
        }
    }, [showArchived, fetchArchivedConversations])

    // Merged search: conversations first, then contacts not in conversations
    const filteredConversations = useMemo((): SidebarDisplayItem[] => {
        // If viewing archived, use archived conversations directly
        // IMPORTANT: Set is_archived: true so UI shows "Unarchive" option
        if (showArchived) {
            return archivedConversations.map((c) => ({
                ...c,
                _source: 'chat' as const,
                is_archived: true,  // Explicitly set for context menu
            }))
        }

        // Regular view: filter by archive status (should already be non-archived from RPC)
        // Issue #4 fix: Add null check to prevent crash if conversations is undefined
        let chatList = (conversations || []) as ConversationProfile[]

        // Convert to SidebarDisplayItem
        let result: SidebarDisplayItem[] = chatList.map((c) => ({
            ...c,
            _source: 'chat' as const,
        }))

        // When searching, also include contacts not in the conversation list
        // Use debounced query for performance (reduces filtering on each keystroke)
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase().trim()

            // Filter chats by search query (include group name for groups)
            result = result.filter((c) => {
                const fullName = c.full_name?.toLowerCase() || ''
                const username = c.username?.toLowerCase() || ''
                const email = c.email?.toLowerCase() || ''
                const groupName = c.name?.toLowerCase() || ''  // For groups
                return fullName.includes(query) || username.includes(query) || email.includes(query) || groupName.includes(query)
            })

            // Get IDs already in chat list
            const conversationIds = new Set(chatList.map((c) => c.id))

            // Find contacts matching search who are NOT in active chats
            const matchingContacts = (contacts || [])
                .filter((contact) => {
                    if (conversationIds.has(contact.id)) return false // Already in chats
                    const fullName = contact.full_name?.toLowerCase() || ''
                    const username = contact.username?.toLowerCase() || ''
                    const email = contact.email?.toLowerCase() || ''
                    return fullName.includes(query) || username.includes(query) || email.includes(query)
                })
                .map((contact) => ({
                    ...contact,
                    _source: 'contact' as const,
                }))

            // Merge: Chats first, then Contacts
            result = [...result, ...matchingContacts]
        }

        return result
    }, [conversations, archivedConversations, contacts, debouncedSearchQuery, showArchived])

    // Check if there are any archived chats
    const hasArchivedChats = useMemo(() => {
        // We need to check if there are archived chats
        // Since we now fetch them separately, check if the array has items
        // Or we can trigger a lightweight check
        return archivedConversations.length > 0
    }, [archivedConversations])

    const handleUserClick = (clickedUser: SidebarDisplayItem | ConversationProfile) => {
        // Set selected user - works for both chats and contacts (even ghost chats)
        setSelectedUser(clickedUser as Profile)
        logger.info('useSidebar:handleUserClick', `Selected user for chat: ${clickedUser.id}`)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
    }

    const clearUserSearch = () => {
        setSearchQuery('')
    }

    const toggleArchived = () => {
        setShowArchived((prev) => !prev)
        // Clear search when toggling archive view
        setSearchQuery('')
    }

    const showSearchResults = searchQuery.trim().length > 0

    return {
        selectedUser,
        handleUserClick,
        searchQuery,
        handleSearchChange,
        showSearchResults,
        clearUserSearch,
        showArchived,
        toggleArchived,
        hasArchivedChats,
        displayList: filteredConversations,
        isLoading: conversationsLoading || contactsLoading,
        error: conversationsError,
        retryFetch: fetchConversations,
    }
}

