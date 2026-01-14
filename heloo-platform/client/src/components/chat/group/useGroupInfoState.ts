/**
 * useGroupInfoState Hook
 * 
 * Custom hook for managing Group Info panel state.
 * Handles member fetching, mute status, and user permissions.
 * 
 * @module components/chat/group/useGroupInfoState
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { groupService, type GroupMember } from '@/lib/services/group.service'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/authStore'
import { triggerHaptic } from '@/hooks/useIsMobileUI'
import { logger } from '@/lib/logger'
import type { UseGroupInfoStateProps, ConfirmDialogState } from './groupInfoTypes'
import { initialConfirmState } from './groupInfoTypes'
import { useMemberActions } from './useMemberActions'

// Re-export types
export type { ConfirmDialogState } from './groupInfoTypes'

export const useGroupInfoState = ({
    groupId,
    isOpen,
    initialGroupName,
    initialGroupAvatar,
    initialGroupDescription,
    onClose,
}: UseGroupInfoStateProps) => {
    // Editable values
    const [groupName, setGroupName] = useState(initialGroupName)
    const [groupAvatar, setGroupAvatar] = useState(initialGroupAvatar)
    const [groupDescription, setGroupDescription] = useState(initialGroupDescription)

    // Members state
    const [members, setMembers] = useState<GroupMember[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Action states
    const [leaving, setLeaving] = useState(false)
    const [removingUserId, setRemovingUserId] = useState<string | null>(null)
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null)

    // Modal states
    const [showAddMember, setShowAddMember] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showMediaGallery, setShowMediaGallery] = useState(false)

    // Confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(initialConfirmState)

    // Settings state
    const [mutedUntil, setMutedUntil] = useState<string | null>(null)
    const [isCreator, setIsCreator] = useState(false)
    const [memberSearchQuery, setMemberSearchQuery] = useState('')

    const { user } = useAuthStore()
    const fetchConversations = useChatStore(state => state.fetchConversations)
    const setSelectedUser = useChatStore(state => state.setSelectedUser)

    // Computed: is current user admin
    const isAdmin = useMemo(() => {
        if (!user?.id || members.length === 0) return false
        const currentMember = members.find(m => m.user_id === user.id)
        return currentMember?.role === 'admin'
    }, [members, user?.id])

    // Computed: filtered members
    const filteredMembers = useMemo(() => {
        if (!memberSearchQuery) return members
        const query = memberSearchQuery.toLowerCase()
        return members.filter(m =>
            (m.profile?.full_name?.toLowerCase() || '').includes(query) ||
            (m.profile?.username?.toLowerCase() || '').includes(query)
        )
    }, [members, memberSearchQuery])

    // Sync props
    useEffect(() => {
        setGroupName(initialGroupName)
        setGroupAvatar(initialGroupAvatar)
        setGroupDescription(initialGroupDescription)
    }, [initialGroupName, initialGroupAvatar, initialGroupDescription])

    // Fetch members
    const fetchMembers = useCallback(async (isRefresh = false) => {
        if (isRefresh) { setRefreshing(true); triggerHaptic('light') }
        else setLoading(true)
        setError(null)

        const result = await groupService.getGroupMembers(groupId)
        if (result.success && result.data) setMembers(result.data)
        else setError(result.error || 'Failed to load members')

        setLoading(false)
        setRefreshing(false)
    }, [groupId])

    // Fetch when opened
    useEffect(() => {
        if (isOpen && groupId) {
            fetchMembers()
            groupService.getMuteStatus(groupId).then(r => r.success && setMutedUntil(r.data ?? null))
            groupService.isGroupCreator(groupId).then(setIsCreator)
        }
    }, [isOpen, groupId, fetchMembers])

    // Confirmation dialog helpers
    const closeConfirmDialog = useCallback(() => setConfirmDialog(initialConfirmState), [])

    // Leave group handler
    const handleLeaveGroup = useCallback(() => {
        setConfirmDialog({
            isOpen: true,
            title: 'Leave Group',
            message: 'Are you sure you want to leave this group?',
            variant: 'danger',
            onConfirm: async () => {
                closeConfirmDialog()
                triggerHaptic('warning')
                setLeaving(true)
                const result = await groupService.leaveGroup(groupId)
                if (result.success) {
                    logger.info('GroupInfoPanel', `Left group: ${groupName}`)
                    onClose()
                    setSelectedUser(null)
                    await fetchConversations()
                } else {
                    setError(result.error || 'Failed to leave group')
                    setLeaving(false)
                }
            },
        })
    }, [groupId, groupName, onClose, setSelectedUser, fetchConversations, closeConfirmDialog])

    // Member actions (extracted hook)
    const memberActions = useMemberActions({
        groupId,
        members,
        isAdmin,
        currentUserId: user?.id,
        fetchMembers,
        closeConfirmDialog,
        setConfirmDialog,
        setRemovingUserId,
        setUpdatingRoleUserId,
        setShowAddMember,
    })

    // Group update handlers
    const handleGroupUpdate = useCallback((name: string, description: string | null) => {
        setGroupName(name)
        setGroupDescription(description)
    }, [])

    const handleAvatarChange = useCallback((newUrl: string) => setGroupAvatar(newUrl), [])

    return {
        // State
        groupName, groupAvatar, groupDescription, members, loading, refreshing, error,
        leaving, removingUserId, updatingRoleUserId, showAddMember, showEditModal,
        showMediaGallery, mutedUntil, isCreator, isAdmin, memberSearchQuery, filteredMembers, user,
        // Confirmation dialog
        confirmDialog, closeConfirmDialog,
        // Setters
        setShowAddMember, setShowEditModal, setShowMediaGallery, setMutedUntil, setMemberSearchQuery,
        // Handlers
        fetchMembers, handleLeaveGroup, handleGroupUpdate, handleAvatarChange,
        ...memberActions,
    }
}
