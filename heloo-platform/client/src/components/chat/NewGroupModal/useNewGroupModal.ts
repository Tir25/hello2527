/**
 * useNewGroupModal Hook
 * 
 * Handles all state and logic for the NewGroupModal.
 * Keeps the main component clean and focused on rendering.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useChatStore } from '@/store/chat'
import { groupService } from '@/lib/services/group.service'
import { triggerHaptic } from '@/hooks/useIsMobileUI'
import { logger } from '@/lib/logger'
import type { Profile } from '@/lib/services/profile.service'

interface UseNewGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onGroupCreated?: (groupId: string) => void
}

export function useNewGroupModal({ isOpen, onClose, onGroupCreated }: UseNewGroupModalProps) {
    const [groupName, setGroupName] = useState('')
    const [selectedMembers, setSelectedMembers] = useState<Profile[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Store state
    const contacts = useChatStore(state => state.contacts)
    const contactsLoading = useChatStore(state => state.contactsLoading)
    const fetchContacts = useChatStore(state => state.fetchContacts)
    const fetchConversations = useChatStore(state => state.fetchConversations)

    // Fetch contacts when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchContacts()
        }
    }, [isOpen, fetchContacts])

    // Filter contacts by search query
    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts
        const query = searchQuery.toLowerCase()
        return contacts.filter(contact =>
            contact.full_name?.toLowerCase().includes(query) ||
            contact.username?.toLowerCase().includes(query)
        )
    }, [contacts, searchQuery])

    // Selected member IDs as Set for O(1) lookup
    const selectedMemberIds = useMemo(
        () => new Set(selectedMembers.map(m => m.id)),
        [selectedMembers]
    )

    // Toggle member selection
    const toggleMember = useCallback((member: Profile) => {
        triggerHaptic('light')
        setSelectedMembers(prev => {
            const isSelected = prev.some(m => m.id === member.id)
            if (isSelected) {
                return prev.filter(m => m.id !== member.id)
            }
            return [...prev, member]
        })
    }, [])

    // Reset state and close
    const handleClose = useCallback(() => {
        setGroupName('')
        setSelectedMembers([])
        setSearchQuery('')
        setError(null)
        onClose()
    }, [onClose])

    // Handle group creation
    const handleCreateGroup = useCallback(async () => {
        if (!groupName.trim()) {
            setError('Please enter a group name')
            return
        }

        if (selectedMembers.length === 0) {
            setError('Please select at least one member')
            return
        }

        setIsCreating(true)
        setError(null)

        try {
            const result = await groupService.createGroup({
                name: groupName.trim(),
                memberIds: selectedMembers.map(m => m.id),
            })

            if (result.success && result.data) {
                logger.info('NewGroupModal', `Created group: ${result.data.name}`)
                triggerHaptic('success')

                // Refresh conversations to include the new group
                await fetchConversations()

                // Call callback with new group ID
                onGroupCreated?.(result.data.id)

                // Reset and close
                handleClose()
            } else {
                setError(result.error || 'Failed to create group')
            }
        } catch (err) {
            logger.error('NewGroupModal', 'Failed to create group', err)
            setError('An unexpected error occurred')
        } finally {
            setIsCreating(false)
        }
    }, [groupName, selectedMembers, fetchConversations, onGroupCreated, handleClose])

    return {
        // State
        groupName,
        setGroupName,
        searchQuery,
        setSearchQuery,
        selectedMembers,
        selectedMemberIds,
        isCreating,
        error,
        contacts,
        filteredContacts,
        contactsLoading,
        // Actions
        toggleMember,
        handleClose,
        handleCreateGroup,
    }
}
