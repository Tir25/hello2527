/**
 * useMessageActions Hook
 * 
 * Handles all message action handlers for the context menu.
 * @module components/chat/MessageContextMenu/useMessageActions
 */

import { useState, useCallback } from 'react'
import { chatService } from '@/lib/services/chat.service'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { DatabaseMessage } from '@/types'

interface UseMessageActionsOptions {
    message: DatabaseMessage
    onClose: () => void
    onEdit: () => void
}

export function useMessageActions({ message, onClose, onEdit }: UseMessageActionsOptions) {
    const [isLoading, setIsLoading] = useState(false)
    const { updateMessage, removeMessage, setReplyingTo } = useChatStore()

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            toast.success('Copied to clipboard')
            onClose()
        } catch (err) {
            logger.error('MessageContextMenu:copy', 'Failed to copy', err)
            toast.error('Failed to copy text')
        }
    }, [message.content, onClose])

    const handleEdit = useCallback(() => {
        onEdit()
        onClose()
    }, [onEdit, onClose])

    const handleUnsend = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await chatService.unsendMessage(message.id)
            if (result.success && result.data) {
                updateMessage(message.id, {
                    content: 'This message was deleted',
                    is_unsent: true,
                    media_url: null,
                })
                toast.success('Message deleted for everyone')
            } else {
                toast.error(result.error || 'Failed to unsend message')
            }
        } catch (err) {
            logger.error('MessageContextMenu:unsend', 'Failed to unsend', err)
            toast.error('Failed to unsend message')
        } finally {
            setIsLoading(false)
            onClose()
        }
    }, [message.id, updateMessage, onClose])

    const handleDeleteForMe = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await chatService.deleteForMe(message.id)
            if (result.success && result.data) {
                removeMessage(message.id)
                toast.success('Message deleted')
            } else {
                toast.error(result.error || 'Failed to delete message')
            }
        } catch (err) {
            logger.error('MessageContextMenu:deleteForMe', 'Failed to delete', err)
            toast.error('Failed to delete message')
        } finally {
            setIsLoading(false)
            onClose()
        }
    }, [message.id, removeMessage, onClose])

    const handlePin = useCallback(async () => {
        setIsLoading(true)
        try {
            const isPinned = message.is_pinned
            const { supabase } = await import('@/lib/supabase')
            const { useAuthStore } = await import('@/store/authStore')
            const userId = useAuthStore.getState().user?.id

            const { error } = await supabase
                .from('messages')
                .update({
                    is_pinned: !isPinned,
                    pinned_at: !isPinned ? new Date().toISOString() : null,
                    pinned_by: !isPinned ? userId : null,
                })
                .eq('id', message.id)

            if (error) throw error
            toast.success(isPinned ? 'Message unpinned' : 'Message pinned')
        } catch (err) {
            logger.error('MessageContextMenu:pin', 'Failed to toggle pin', err)
            toast.error('Failed to pin message')
        } finally {
            setIsLoading(false)
            onClose()
        }
    }, [message, onClose])

    const handleReply = useCallback(() => {
        setReplyingTo(message)
        onClose()
    }, [message, setReplyingTo, onClose])

    return {
        isLoading,
        handleCopy,
        handleEdit,
        handleUnsend,
        handleDeleteForMe,
        handlePin,
        handleReply,
    }
}
