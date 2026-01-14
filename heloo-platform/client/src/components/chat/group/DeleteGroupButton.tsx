/**
 * DeleteGroupButton Component
 * 
 * Button for deleting a group (creator only).
 * Shows confirmation dialog before deletion.
 * 
 * Responsibility: Group deletion with confirmation
 */

import { useState, useCallback } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { groupService } from '@/lib/services/group.service'
import { useChatStore } from '@/store/chat'
import { toast } from '@/store/toastStore'
import { triggerHaptic } from '@/hooks/useIsMobileUI'
import { cn } from '@/utils/cn'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface DeleteGroupButtonProps {
    groupId: string
    groupName: string
    isCreator: boolean
    onDeleted: () => void
    className?: string
}

export const DeleteGroupButton = ({
    groupId,
    groupName,
    isCreator,
    onDeleted,
    className,
}: DeleteGroupButtonProps) => {
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const fetchConversations = useChatStore(state => state.fetchConversations)
    const setSelectedUser = useChatStore(state => state.setSelectedUser)

    const executeDelete = useCallback(async () => {
        setShowConfirm(false)
        triggerHaptic('warning')
        setLoading(true)

        const result = await groupService.deleteGroup(groupId)

        if (result.success) {
            toast.success('Group deleted')
            setSelectedUser(null)
            await fetchConversations()
            onDeleted()
        } else {
            toast.error(result.error || 'Failed to delete group')
            setLoading(false)
        }
    }, [groupId, fetchConversations, setSelectedUser, onDeleted])

    const handleClick = useCallback(() => {
        triggerHaptic('light')
        setShowConfirm(true)
    }, [])

    const handleCancel = useCallback(() => {
        setShowConfirm(false)
    }, [])

    if (!isCreator) {
        return null
    }

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className={cn(
                    "w-full py-3.5 px-4 rounded-xl font-medium",
                    "bg-red-500 text-white hover:bg-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-[0.98] transition-all",
                    "flex items-center justify-center gap-2 min-h-[50px]",
                    className
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Deleting...
                    </>
                ) : (
                    <>
                        <Trash2 className="w-5 h-5" />
                        Delete Group
                    </>
                )}
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                title="Delete Group"
                message={`Are you sure you want to delete "${groupName}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={executeDelete}
                onCancel={handleCancel}
            />
        </>
    )
}
