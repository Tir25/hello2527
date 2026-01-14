/**
 * useMemberActions Hook
 * 
 * Member management actions for GroupInfoPanel.
 * @module components/chat/group/useMemberActions
 */

import { useCallback } from 'react'
import { groupService, type GroupMember } from '@/lib/services/group.service'
import { triggerHaptic } from '@/hooks/useIsMobileUI'
import { toast } from '@/store/toastStore'
import type { ConfirmDialogState } from './groupInfoTypes'

interface UseMemberActionsOptions {
    groupId: string
    members: GroupMember[]
    isAdmin: boolean
    currentUserId?: string
    fetchMembers: (isRefresh?: boolean) => Promise<void>
    closeConfirmDialog: () => void
    setConfirmDialog: (state: ConfirmDialogState) => void
    setRemovingUserId: (id: string | null) => void
    setUpdatingRoleUserId: (id: string | null) => void
    setShowAddMember: (show: boolean) => void
}

export function useMemberActions({
    groupId,
    members,
    isAdmin,
    currentUserId,
    fetchMembers,
    closeConfirmDialog,
    setConfirmDialog,
    setRemovingUserId,
    setUpdatingRoleUserId,
    setShowAddMember,
}: UseMemberActionsOptions) {
    /**
     * Execute remove member
     */
    const executeRemoveMember = useCallback(async (userId: string, userName: string) => {
        closeConfirmDialog()
        triggerHaptic('warning')
        setRemovingUserId(userId)

        const result = await groupService.removeMember(groupId, userId)

        if (result.success) {
            toast.success(`${userName} removed from group`)
            await fetchMembers(true)
        } else {
            toast.error(result.error || 'Failed to remove member')
        }

        setRemovingUserId(null)
    }, [groupId, fetchMembers, closeConfirmDialog, setRemovingUserId])

    /**
     * Handle remove member (shows confirmation)
     */
    const handleRemoveMember = useCallback((userId: string, userName: string) => {
        if (!isAdmin) {
            toast.error('Only admins can remove members')
            return
        }

        if (userId === currentUserId) {
            toast.error('Use "Leave Group" to remove yourself')
            return
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Remove Member',
            message: `Remove ${userName} from this group?`,
            variant: 'danger',
            onConfirm: () => executeRemoveMember(userId, userName),
        })
    }, [isAdmin, currentUserId, executeRemoveMember, setConfirmDialog])

    /**
     * Handle toggle role
     */
    const handleToggleRole = useCallback(async (userId: string, currentRole: 'admin' | 'member') => {
        if (!isAdmin) {
            toast.error('Only admins can change roles')
            return
        }

        const newRole = currentRole === 'admin' ? 'member' : 'admin'
        const member = members.find(m => m.user_id === userId)
        const memberName = member?.profile?.full_name || 'Member'

        triggerHaptic('light')
        setUpdatingRoleUserId(userId)

        const result = await groupService.updateMemberRole(groupId, userId, newRole)

        if (result.success) {
            toast.success(`${memberName} is now ${newRole === 'admin' ? 'an admin' : 'a member'}`)
            await fetchMembers(true)
        } else {
            toast.error(result.error || 'Failed to update role')
        }

        setUpdatingRoleUserId(null)
    }, [groupId, isAdmin, members, fetchMembers, setUpdatingRoleUserId])

    /**
     * Handle add member click
     */
    const handleAddMemberClick = useCallback(() => {
        if (!isAdmin) {
            toast.error('Only admins can add members')
            return
        }
        triggerHaptic('light')
        setShowAddMember(true)
    }, [isAdmin, setShowAddMember])

    return { handleRemoveMember, handleToggleRole, handleAddMemberClick }
}
