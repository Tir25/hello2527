import { useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useChatWindow } from '@/hooks/chat/useChatWindow'
import { useAutoScroll } from '@/hooks/chat/useAutoScroll'
import { useMessageStatus } from '@/hooks/useMessageStatus'
import { WelcomeScreen } from '@/components/features/WelcomeScreen'
import { ChatHeader } from '@/components/features/ChatHeader'
import { MessageInput } from '@/components/chat/MessageInput'
import { MessageList } from './MessageList'
import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import { TypingIndicator } from './TypingIndicator'
import { logger } from '@/lib/logger'

/**
 * ChatWindow Container Component
 * 
 * Responsibility: Main chat window container
 * Layer: UI Component (View)
 * 
 * Connects hooks to UI components - minimal logic, mostly composition
 */

export const ChatWindow = () => {
    const {
        fetchMessages,
        subscribeToMessages,
        unsubscribeFromMessages,
        setSelectedUser,
    } = useChat()
    const { user } = useAuthStore()
    const {
        selectedUser,
        messages,
        loading,
        isUserTyping,
        handleSendMessage,
        messagesEndRef,
        messagesContainerRef,
    } = useChatWindow()

    // Auto-scroll hook
    useAutoScroll({
        messages,
        messagesEndRef,
        messagesContainerRef,
    })

    // PRODUCTION OPTIMIZATION: Memoize user IDs to prevent unnecessary hook re-execution
    // This ensures useMessageStatus only re-runs when actual user IDs change, not on every render
    const messageStatusProps = useMemo(() => ({
        selectedUserId: selectedUser?.id || null,
        currentUserId: user?.id || null,
    }), [selectedUser?.id, user?.id])

    // CRITICAL: Mark messages as seen automatically
    useMessageStatus(messageStatusProps)

    // MOBILE FIX: Handle keyboard appearance to keep input visible
    // When the virtual keyboard appears, the viewport height decreases
    // This effect ensures the input field scrolls into view proactively
    useEffect(() => {
        const handleViewportResize = () => {
            if (!window.visualViewport) return

            const viewportHeight = window.visualViewport.height
            const windowHeight = window.innerHeight

            // If viewport is significantly smaller, keyboard is likely showing
            // Threshold: 70% - if viewport < 70% of window height, keyboard is open
            if (viewportHeight < windowHeight * 0.7) {
                // Use requestAnimationFrame to ensure DOM has updated
                requestAnimationFrame(() => {
                    const inputElement = document.querySelector('.z-chat-input')
                    if (inputElement) {
                        inputElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                        })
                    }
                })
            }
        }

        window.visualViewport?.addEventListener('resize', handleViewportResize)

        return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportResize)
        }
    }, [])

    // Fetch messages and subscribe when user is selected
    useEffect(() => {
        if (selectedUser && user?.id) {
            logger.info('ChatWindow', `Fetching messages for conversation with ${selectedUser.id}`)
            unsubscribeFromMessages()
            fetchMessages(selectedUser.id, user.id)
            subscribeToMessages(user.id)
            return () => {
                unsubscribeFromMessages()
            }
        } else {
            unsubscribeFromMessages()
            useChatStore.getState().setMessages([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUser?.id, user?.id])

    // Show welcome screen if no user selected
    if (!selectedUser) {
        return <WelcomeScreen />
    }

    return (
        <div className="flex flex-col h-full chat-container overflow-hidden">
            {/* Header */}
            <div className="flex-none">
                <ChatHeader
                    selectedUser={selectedUser}
                    onBack={() => setSelectedUser(null)}
                    showBackButton={true}
                />
            </div>

            {/* Messages Area */}
            {loading ? (
                <LoadingState />
            ) : messages.length === 0 ? (
                <EmptyState userName={selectedUser.full_name || selectedUser.email || 'User'} />
            ) : (
                <MessageList
                    messages={messages}
                    currentUserId={user?.id || ''}
                    recipientProfile={selectedUser}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                />
            )}

            {/* Typing Indicator */}
            <AnimatePresence>
                {selectedUser && isUserTyping(selectedUser.id) && (
                    <TypingIndicator
                        userName={selectedUser.full_name || selectedUser.email || 'User'}
                    />
                )}
            </AnimatePresence>

            {/* Input */}
            <div className="flex-none">
                <MessageInput
                    onSend={handleSendMessage}
                    disabled={loading}
                    receiverId={selectedUser.id}
                />
            </div>
        </div>
    )
}
