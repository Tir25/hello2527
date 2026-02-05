/**
 * ChatWindow Container Component
 * 
 * Main chat window - connects hooks to UI components.
 * @module components/chat/ChatWindow
 */

import { useEffect, useMemo, useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useChatWindow } from '@/hooks/chat/useChatWindow'
import { useAutoScroll } from '@/hooks/chat/useAutoScroll'
import { useMessageStatus } from '@/hooks/useMessageStatus'
import { useChatRelationship } from '@/hooks/chat/useChatRelationship'
import { useTypingDisplay } from '@/hooks/chat/useTypingDisplay'
import { useKeyboardVisibility } from '@/hooks/chat/useKeyboardVisibility'
import { useScrollPosition } from '@/hooks/chat/useScrollPosition'
import { useConversationInfo } from '@/hooks/chat/useConversationInfo'
import { useChatCallHandlers } from '@/hooks/chat/useChatCallHandlers'
import { WelcomeScreen } from '@/components/features/WelcomeScreen'
import { ChatHeader } from '@/components/features/ChatHeader'
import { MessageInput } from '@/components/chat/MessageInput'
import { RequestBanner } from '@/components/chat/RequestBanner'
import { GroupInfoPanel } from '@/components/chat/GroupInfoPanel'
import { PinnedMessageBar } from '@/components/chat/pins'
import { MediaGalleryModal } from '@/components/chat/gallery/MediaGalleryModal'
import { MessageList } from './MessageList'
import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import { TypingIndicator } from './TypingIndicator'
import { ScrollToBottom } from './ScrollToBottom'
import { logger } from '@/lib/logger'

export const ChatWindow = () => {
    const { fetchMessages, subscribeToMessages, unsubscribeFromMessages, setSelectedUser } = useChat()
    const fetchGroupMessages = useChatStore((state) => state.fetchGroupMessages)
    const isUserOnline = useChatStore((state) => state.isUserOnline)
    const { user } = useAuthStore()
    const { selectedUser, messages, loading, handleSendMessage, messagesEndRef, messagesContainerRef } = useChatWindow()

    // Panel states
    const [showGroupInfo, setShowGroupInfo] = useState(false)
    const [showGallery, setShowGallery] = useState(false)

    // Conversation info (extracted hook)
    const { currentConversation, isGroup, groupName, groupAvatar, groupDescription, memberCount, isGroupAdmin } = useConversationInfo({
        selectedUserId: selectedUser?.id,
        currentUserId: user?.id,
    })

    // Relationship management
    const {
        isBlocked,
        relationshipStatus,
        relationshipId,
        isRequester,
        isBlocker,
        relationshipLoading,
        canChat,
        checkRelationship,
        handleRelationshipChange
    } = useChatRelationship({
        selectedUserId: selectedUser?.id,
        currentUserId: user?.id,
        isGroup,
    })

    // Call handlers (extracted hook)
    const { onVideoCall, onVoiceCall, callsEnabled } = useChatCallHandlers({
        selectedUserId: selectedUser?.id,
        currentUserId: user?.id,
        isGroup,
        canChat,
    })

    // Keyboard visibility
    useKeyboardVisibility()

    // Filter messages based on chat_deleted_at
    const filteredMessages = useMemo(() => {
        if (!currentConversation?.chat_deleted_at) return messages
        const deletedAt = new Date(currentConversation.chat_deleted_at).getTime()
        return messages.filter((m) => new Date(m.created_at).getTime() > deletedAt)
    }, [messages, currentConversation?.chat_deleted_at])

    // Auto-scroll
    useAutoScroll({ messages: filteredMessages, messagesEndRef, messagesContainerRef })

    // Message status
    useMessageStatus({ selectedUserId: selectedUser?.id || null, currentUserId: user?.id || null })

    // Typing indicator
    const userName = selectedUser?.full_name || selectedUser?.username || selectedUser?.email || 'User'
    const { shouldShowTyping, typingDisplayName } = useTypingDisplay({
        selectedUserId: selectedUser?.id,
        isGroup,
        userName,
        canShowTyping: canChat,
    })

    // Scroll position
    const { isScrolledUp, scrollToBottom } = useScrollPosition({ containerRef: messagesContainerRef, threshold: 200 })

    // Initialize chat
    const initializeChat = useCallback(async () => {
        if (!selectedUser || !user?.id) {
            unsubscribeFromMessages()
            useChatStore.getState().setMessages([])
            return
        }
        logger.info('ChatWindow', `Fetching messages for ${selectedUser.id}`)
        unsubscribeFromMessages()
        await checkRelationship()

        const conv = useChatStore.getState().conversations.find((c) => c.id === selectedUser.id)
        if (conv?.is_group) fetchGroupMessages(selectedUser.id)
        else fetchMessages(selectedUser.id, user.id)
        subscribeToMessages(user.id)
    }, [selectedUser?.id, user?.id, checkRelationship, fetchMessages, fetchGroupMessages, subscribeToMessages, unsubscribeFromMessages])

    useEffect(() => {
        let isMounted = true
        const init = async () => { if (isMounted) await initializeChat() }
        init()
        return () => { isMounted = false; unsubscribeFromMessages() }
    }, [initializeChat, unsubscribeFromMessages])

    // Pinned message click handler
    const handlePinnedClick = useCallback((messageId: string) => {
        const el = document.getElementById(`message-${messageId}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('bg-amber-100/50')
            setTimeout(() => el.classList.remove('bg-amber-100/50'), 2000)
        }
    }, [])

    if (!selectedUser) return <WelcomeScreen />

    return (
        <div className="flex flex-col h-full chat-container overflow-hidden relative">
            <div className="flex-none">
                <ChatHeader
                    selectedUser={selectedUser}
                    onBack={() => setSelectedUser(null)}
                    showBackButton={true}
                    isGroup={isGroup}
                    isOnline={!isGroup && selectedUser ? isUserOnline(selectedUser.id) : false}
                    groupName={groupName}
                    groupAvatar={groupAvatar}
                    memberCount={memberCount}
                    onGroupInfoClick={() => setShowGroupInfo(true)}
                    onGalleryClick={!isGroup ? () => setShowGallery(true) : undefined}
                    onVideoCall={onVideoCall}
                    onVoiceCall={onVoiceCall}
                    callsEnabled={callsEnabled}
                />
            </div>

            {isGroup && (
                <GroupInfoPanel isOpen={showGroupInfo} onClose={() => setShowGroupInfo(false)}
                    groupId={selectedUser.id} groupName={groupName || 'Group'} groupAvatar={groupAvatar} groupDescription={groupDescription} />
            )}

            {!isGroup && (
                <MediaGalleryModal isOpen={showGallery} onClose={() => setShowGallery(false)}
                    conversationId={selectedUser.id} isGroup={false} currentUserId={user?.id}
                    conversationName={selectedUser.full_name || selectedUser.username || 'User'} chatDeletedAt={currentConversation?.chat_deleted_at} />
            )}

            <PinnedMessageBar conversationId={selectedUser.id} currentUserId={user?.id}
                isGroup={isGroup} canUnpin={isGroup ? isGroupAdmin : true} onMessageClick={handlePinnedClick} />

            <div className="flex-1 flex flex-col min-h-0 relative overflow-x-hidden">
                {loading || relationshipLoading ? <LoadingState /> : filteredMessages.length === 0 ? <EmptyState userName={userName} /> : (
                    <>
                        <MessageList messages={filteredMessages} currentUserId={user?.id || ''} recipientProfile={selectedUser}
                            messagesContainerRef={messagesContainerRef} messagesEndRef={messagesEndRef} isGroup={isGroup} isGroupAdmin={isGroupAdmin} />
                        <ScrollToBottom visible={isScrolledUp && filteredMessages.length > 5} onClick={scrollToBottom} />
                    </>
                )}
            </div>

            <AnimatePresence>{shouldShowTyping && <TypingIndicator userName={typingDisplayName} />}</AnimatePresence>

            {!canChat && !isGroup ? (
                <RequestBanner
                    userName={userName}
                    userId={selectedUser.id}
                    relationshipStatus={relationshipStatus}
                    relationshipId={relationshipId}
                    isRequester={isRequester}
                    isBlocker={isBlocker}
                    onStatusChange={handleRelationshipChange}
                />
            ) : isBlocked ? (
                <RequestBanner
                    userName={userName}
                    userId={selectedUser.id}
                    relationshipStatus="blocked"
                    relationshipId={relationshipId}
                    isRequester={isRequester}
                    isBlocker={isBlocker}
                    onStatusChange={handleRelationshipChange}
                />
            ) : canChat ? (
                <div className="flex-none">
                    <MessageInput onSend={handleSendMessage} disabled={loading}
                        receiverId={isGroup ? undefined : selectedUser.id} groupId={isGroup ? selectedUser.id : undefined} isGroup={isGroup} />
                </div>
            ) : null}
        </div>
    )
}
