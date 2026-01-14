import { useRef, useEffect, useMemo } from 'react'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chat'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import { socketService } from '@/lib/services/socket.service'
import { getDMRoomId } from '@/utils/chat'

/**
 * ChatWindow Hook
 * 
 * Responsibility: Orchestrates chat window logic
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Message fetching and subscription
 * - Send message handling (DM and GROUP)
 * - Auto-scroll management
 * - Socket.IO room management for both groups AND DMs
 * - Cleanup on unmount
 */

export interface UseChatWindowReturn {
    selectedUser: ReturnType<typeof useChat>['selectedUser']
    messages: ReturnType<typeof useChat>['messages']
    loading: ReturnType<typeof useChat>['loading']
    isUserTyping: ReturnType<typeof useChat>['isUserTyping']
    handleSendMessage: (
        content: string,
        mediaUrl?: string,
        mediaType?: 'image' | 'video' | 'audio' | 'document',
        replyToId?: string
    ) => Promise<void>
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    messagesContainerRef: React.RefObject<HTMLDivElement | null>
}

export const useChatWindow = (): UseChatWindowReturn => {
    const {
        selectedUser,
        messages,
        loading,
        sendMessage,
        isUserTyping,
    } = useChat()
    const { user } = useAuthStore()

    // Get sendGroupMessage action from store
    const sendGroupMessage = useChatStore((state) => state.sendGroupMessage)

    // Get conversations to detect if current conversation is a group
    const conversations = useChatStore((state) => state.conversations)

    // Memoize isGroup to prevent Socket.IO room churn
    // Only recompute when selectedUser changes, not on every conversations update
    const isGroup = useMemo(() => {
        if (!selectedUser?.id) return false
        const conv = conversations.find((c) => c.id === selectedUser.id)
        return conv?.is_group === true
    }, [selectedUser?.id, conversations])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Socket.IO Room Management for BOTH Groups and DMs
    useEffect(() => {
        if (!selectedUser?.id || !user?.id) return

        // Compute the room ID
        let roomId: string
        if (isGroup) {
            roomId = selectedUser.id // Group ID is the room ID
        } else {
            // DM: Create stable room ID from both user IDs
            roomId = getDMRoomId(user.id, selectedUser.id)
        }

        // Join the room
        socketService.joinConversation(roomId)
        logger.debug('useChatWindow', `Joined Socket.IO room: ${roomId}`, { isGroup })

        // Listen for messages in this room (for groups - instant update with full reply_to)
        if (isGroup) {
            socketService.onMessageReceive((message) => {
                if (message.group_id === selectedUser.id) {
                    useChatStore.getState().addMessage(message)
                }
            })
        }

        return () => {
            socketService.leaveConversation(roomId)
            if (isGroup) {
                socketService.offMessageReceive()
            }
            logger.debug('useChatWindow', `Left Socket.IO room: ${roomId}`)
        }
    }, [selectedUser?.id, user?.id, isGroup])


    const handleSendMessage = async (
        content: string,
        mediaUrl?: string,
        mediaType?: 'image' | 'video' | 'audio' | 'document',
        replyToId?: string
    ) => {
        if (!selectedUser || !user?.id) return

        // Detect if this is a group conversation
        const currentConversation = conversations.find((c) => c.id === selectedUser.id)
        const isGroup = currentConversation?.is_group === true

        if (isGroup) {
            // GROUP MESSAGE: Use sendGroupMessage action
            logger.debug('useChatWindow:handleSendMessage', `Sending group message to ${selectedUser.id}`)
            const result = await sendGroupMessage(
                selectedUser.id,
                content,
                mediaUrl,
                mediaType as 'image' | 'video' | 'audio' | 'document' | undefined,
                replyToId
            )
            if (!result.success) {
                toast.error(result.error || 'Failed to send group message. Please try again.')
                return
            }
        } else {
            // DM MESSAGE: Use regular sendMessage
            const result = await sendMessage(content, selectedUser.id, user.id, mediaUrl, mediaType, replyToId)
            if (!result.success) {
                // Error already logged and toasted by sendMessage
                return
            }
        }
    }

    return {
        selectedUser,
        messages,
        loading,
        isUserTyping,
        handleSendMessage,
        messagesEndRef,
        messagesContainerRef,
    }
}
