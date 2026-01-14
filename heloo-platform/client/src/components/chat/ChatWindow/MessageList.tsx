/**
 * MessageList Component - Production Optimized
 * 
 * Responsibility: Render message list with date separators and performance optimizations
 * Layer: UI Component (View)
 * 
 * Features:
 * - Date separators between messages from different days
 * - Performance optimized with React.memo
 * - Sender grouping for consecutive messages
 * 
 * Note: For conversations with 500+ messages, consider adding react-window
 */

import { memo, useCallback, useMemo, RefObject } from 'react'
import { MessageBubble } from '@/components/chat/message/MessageBubble'
import { DateSeparator } from '@/components/chat/message/DateSeparator'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import { isSameDay } from 'date-fns'

interface MessageListProps {
    messages: DatabaseMessage[]
    currentUserId: string
    recipientProfile?: Profile | null
    messagesContainerRef: RefObject<HTMLDivElement | null>
    messagesEndRef: RefObject<HTMLDivElement | null>
    isGroup?: boolean
    isGroupAdmin?: boolean
    groupMembers?: Map<string, Profile>
}

// Memoized individual message wrapper
const MemoizedMessage = memo(
    ({ message, isOwn, recipientProfile, isLastMessage, currentUserId, isGroup, isGroupAdmin, senderProfile, showSenderInfo }: {
        message: DatabaseMessage
        isOwn: boolean
        recipientProfile?: Profile | null
        isLastMessage: boolean
        currentUserId: string
        isGroup?: boolean
        isGroupAdmin?: boolean
        senderProfile?: Profile | null
        showSenderInfo?: boolean
    }) => (
        <MessageBubble
            message={message}
            isOwn={isOwn}
            recipientProfile={recipientProfile}
            isLastMessage={isLastMessage}
            currentUserId={currentUserId}
            isGroup={isGroup}
            isGroupAdmin={isGroupAdmin}
            senderProfile={senderProfile}
            showSenderInfo={showSenderInfo}
        />
    ),
    (prevProps, nextProps) => {
        return (
            prevProps.message.id === nextProps.message.id &&
            prevProps.message.status === nextProps.message.status &&
            prevProps.message.content === nextProps.message.content &&
            prevProps.message.is_edited === nextProps.message.is_edited &&
            prevProps.message.is_unsent === nextProps.message.is_unsent &&
            prevProps.message.reply_to?.id === nextProps.message.reply_to?.id &&
            prevProps.isOwn === nextProps.isOwn &&
            prevProps.isLastMessage === nextProps.isLastMessage &&
            prevProps.recipientProfile?.id === nextProps.recipientProfile?.id &&
            prevProps.recipientProfile?.avatar_url === nextProps.recipientProfile?.avatar_url &&
            prevProps.isGroup === nextProps.isGroup &&
            prevProps.isGroupAdmin === nextProps.isGroupAdmin &&
            prevProps.showSenderInfo === nextProps.showSenderInfo &&
            prevProps.senderProfile?.id === nextProps.senderProfile?.id
        )
    }
)

MemoizedMessage.displayName = 'MemoizedMessage'

export const MessageList = memo(
    ({
        messages,
        currentUserId,
        recipientProfile,
        messagesContainerRef,
        messagesEndRef,
        isGroup = false,
        isGroupAdmin = false,
        groupMembers,
    }: MessageListProps) => {
        const lastMessageIndex = useMemo(() => messages.length - 1, [messages.length])

        const isOwnMessage = useCallback(
            (senderId: string) => senderId === currentUserId,
            [currentUserId]
        )

        const getSenderProfile = useCallback(
            (senderId: string) => groupMembers?.get(senderId) ?? null,
            [groupMembers]
        )

        // Determine if we should show sender info (different sender than previous message)
        const shouldShowSenderInfo = useCallback(
            (index: number, currentSenderId: string) => {
                if (index === 0) return true
                const prevMessage = messages[index - 1]
                return prevMessage.sender_id !== currentSenderId
            },
            [messages]
        )

        // Check if we should show date separator before this message
        const shouldShowDateSeparator = useCallback(
            (index: number): boolean => {
                if (index === 0) return true // Always show for first message

                const currentDate = new Date(messages[index].created_at)
                const prevDate = new Date(messages[index - 1].created_at)

                return !isSameDay(currentDate, prevDate)
            },
            [messages]
        )

        return (
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overscroll-none px-1 pt-3 pb-2 messages-scroll"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className="space-y-0">
                    {messages.map((message, index) => {
                        const isOwn = isOwnMessage(message.sender_id)
                        const senderProfile = isGroup && !isOwn ? getSenderProfile(message.sender_id) : null
                        const showSenderInfo = isGroup && !isOwn ? shouldShowSenderInfo(index, message.sender_id) : false
                        const showDateSeparator = shouldShowDateSeparator(index)

                        return (
                            <div key={message.id}>
                                {/* Date separator */}
                                {showDateSeparator && (
                                    <DateSeparator date={message.created_at} />
                                )}

                                {/* Message bubble */}
                                <MemoizedMessage
                                    message={message}
                                    isOwn={isOwn}
                                    recipientProfile={recipientProfile}
                                    isLastMessage={index === lastMessageIndex}
                                    currentUserId={currentUserId}
                                    isGroup={isGroup}
                                    isGroupAdmin={isGroupAdmin}
                                    senderProfile={senderProfile}
                                    showSenderInfo={showSenderInfo}
                                />
                            </div>
                        )
                    })}
                </div>
                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-px" />
            </div>
        )
    },
    (prevProps, nextProps) => {
        if (prevProps.messages.length !== nextProps.messages.length) return false
        if (prevProps.currentUserId !== nextProps.currentUserId) return false
        if (prevProps.recipientProfile?.id !== nextProps.recipientProfile?.id) return false
        if (prevProps.isGroup !== nextProps.isGroup) return false
        if (prevProps.groupMembers !== nextProps.groupMembers) return false

        // Check last 10 messages for changes
        const checkCount = Math.min(10, prevProps.messages.length)
        for (let i = prevProps.messages.length - 1; i >= prevProps.messages.length - checkCount; i--) {
            const prev = prevProps.messages[i]
            const next = nextProps.messages[i]
            if (!prev || !next) return false
            if (
                prev.id !== next.id ||
                prev.status !== next.status ||
                prev.content !== next.content ||
                prev.is_edited !== next.is_edited ||
                prev.is_unsent !== next.is_unsent ||
                prev.reply_to?.id !== next.reply_to?.id
            ) {
                return false
            }
        }

        return true
    }
)

MessageList.displayName = 'MessageList'
