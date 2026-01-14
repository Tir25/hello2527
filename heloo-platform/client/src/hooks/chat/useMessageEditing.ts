/**
 * useMessageEditing Hook
 * 
 * Manages message editing state and actions.
 * Extracted from MessageBubble for better separation of concerns.
 */

import { useState, useCallback } from 'react'
import { chatService } from '@/lib/services/chat.service'
import { useChatStore } from '@/store/chatStore'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'

interface UseMessageEditingOptions {
    messageId: string
    originalContent: string
}

interface UseMessageEditingResult {
    isEditing: boolean
    editContent: string
    isEditLoading: boolean
    setEditContent: (content: string) => void
    startEditing: () => void
    cancelEditing: () => void
    saveEdit: () => Promise<void>
    handleKeyDown: (e: React.KeyboardEvent) => void
}

export const useMessageEditing = ({
    messageId,
    originalContent,
}: UseMessageEditingOptions): UseMessageEditingResult => {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(originalContent)
    const [isEditLoading, setIsEditLoading] = useState(false)
    const { updateMessage } = useChatStore()

    const startEditing = useCallback(() => {
        setEditContent(originalContent)
        setIsEditing(true)
    }, [originalContent])

    const cancelEditing = useCallback(() => {
        setIsEditing(false)
        setEditContent(originalContent)
    }, [originalContent])

    const saveEdit = useCallback(async () => {
        if (!editContent.trim() || editContent === originalContent) {
            cancelEditing()
            return
        }

        setIsEditLoading(true)
        try {
            const result = await chatService.editMessage(messageId, editContent.trim())

            if (result.success && result.data) {
                updateMessage(messageId, {
                    content: editContent.trim(),
                    is_edited: true,
                })
                toast.success('Message edited')
                setIsEditing(false)
            } else {
                toast.error(result.error || 'Failed to edit message')
            }
        } catch (err) {
            logger.error('useMessageEditing:saveEdit', 'Failed to save edit', err)
            toast.error('Failed to edit message')
        } finally {
            setIsEditLoading(false)
        }
    }, [editContent, messageId, originalContent, updateMessage, cancelEditing])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            saveEdit()
        } else if (e.key === 'Escape') {
            cancelEditing()
        }
    }, [saveEdit, cancelEditing])

    return {
        isEditing,
        editContent,
        isEditLoading,
        setEditContent,
        startEditing,
        cancelEditing,
        saveEdit,
        handleKeyDown,
    }
}
