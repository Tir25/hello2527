/**
 * useUserItemActions Hook
 * 
 * Handles archive, unarchive, and delete operations for conversation items.
 * Extracted from UserItem for modularity and reusability.
 * 
 * Responsibility: Conversation item CRUD operations
 * Layer: Hook (Logic)
 */

import { useState, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { chatService } from '@/lib/services/chat.service'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'

interface UseUserItemActionsOptions {
    userId: string
    isArchived: boolean
    isSelected: boolean
    onArchiveChange?: () => void
}

interface UseUserItemActionsReturn {
    isProcessing: boolean
    showDeleteConfirm: boolean
    setShowDeleteConfirm: (show: boolean) => void
    handleArchive: () => Promise<void>
    handleDeleteClick: () => void
    handleDeleteConfirm: () => Promise<void>
}

export const useUserItemActions = ({
    userId,
    isArchived,
    isSelected,
    onArchiveChange,
}: UseUserItemActionsOptions): UseUserItemActionsReturn => {
    const { setSelectedUser } = useChatStore()
    const [isProcessing, setIsProcessing] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleArchive = useCallback(async () => {
        if (isProcessing) return

        setIsProcessing(true)
        try {
            const result = isArchived
                ? await chatService.unarchiveChat(userId)
                : await chatService.archiveChat(userId)

            if (result.success) {
                onArchiveChange?.()
            } else {
                toast.error(result.error || 'Failed to update archive status')
            }
        } catch (error) {
            logger.error('useUserItemActions:handleArchive', 'Failed to archive/unarchive', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsProcessing(false)
        }
    }, [userId, isArchived, onArchiveChange, isProcessing])

    const handleDeleteClick = useCallback(() => {
        if (isProcessing) return
        setShowDeleteConfirm(true)
    }, [isProcessing])

    const handleDeleteConfirm = useCallback(async () => {
        setShowDeleteConfirm(false)
        setIsProcessing(true)

        try {
            const result = await chatService.deleteChat(userId)

            if (result.success) {
                // Clear selected user if this was the selected chat
                if (isSelected) {
                    setSelectedUser(null)
                }
                // Optimistically clear local messages and remove conversation
                useChatStore.setState({ messages: [] })
                const { conversations } = useChatStore.getState()
                useChatStore.setState({
                    conversations: conversations.filter((conv) => conv.id !== userId),
                })
                onArchiveChange?.()
            } else {
                toast.error(result.error || 'Failed to delete chat')
            }
        } catch (error) {
            logger.error('useUserItemActions:handleDelete', 'Failed to delete chat', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsProcessing(false)
        }
    }, [userId, onArchiveChange, isSelected, setSelectedUser])

    return {
        isProcessing,
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleArchive,
        handleDeleteClick,
        handleDeleteConfirm,
    }
}
