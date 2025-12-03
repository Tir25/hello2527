import { useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'

/**
 * ChatWindow Hook
 * 
 * Responsibility: Orchestrates chat window logic
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Message fetching and subscription
 * - Send message handling
 * - Auto-scroll management
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
        mediaType?: 'image' | 'video' | 'audio' | 'document'
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

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    const handleSendMessage = async (
        content: string,
        mediaUrl?: string,
        mediaType?: 'image' | 'video' | 'audio' | 'document'
    ) => {
        if (!selectedUser || !user?.id) return

        const result = await sendMessage(content, selectedUser.id, user.id, mediaUrl, mediaType)
        if (!result.success) {
            // Error already logged and toasted by sendMessage
            return
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
