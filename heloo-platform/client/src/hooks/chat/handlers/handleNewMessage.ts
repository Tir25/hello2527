/**
 * Handle New Message Event
 * 
 * Responsibility: Process INSERT events from Supabase Realtime
 * Layer: Event Handler
 * 
 * Extracted from useGlobalMessageListener for modularity.
 * Handles: Incoming message updates, optimistic message replacement, delivery marking.
 */

import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import type { DatabaseMessage, ReplyToMessage } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Fetches the original message to build reply_to context
 * Used when receiver gets a message with reply_to_id but no reply_to object
 */
const fetchReplyToData = async (messageId: string): Promise<ReplyToMessage | null> => {
    try {
        // First fetch the message
        const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('id, content, sender_id, media_type')
            .eq('id', messageId)
            .single()

        if (messageError || !messageData) {
            logger.error('fetchReplyToData', 'Failed to fetch original message', messageError)
            return null
        }

        // Then fetch the sender's profile
        let senderName: string | null = null
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', messageData.sender_id)
            .single()

        if (profileData) {
            senderName = profileData.full_name || null
        }

        // Build the reply_to object
        return {
            id: messageData.id,
            content: messageData.content || '',
            sender_id: messageData.sender_id,
            sender_name: senderName,
            media_type: messageData.media_type || null,
        }
    } catch (err) {
        logger.error('fetchReplyToData', 'Unexpected error', err)
        return null
    }
}

/**
 * Creates a handler for new message events
 * @param currentUserId - The authenticated user's ID
 */
export const createNewMessageHandler = (currentUserId: string) => {
    return (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
        try {
            const newMessage = payload.new as DatabaseMessage

            logger.info('handleNewMessage', 'New message received', {
                messageId: newMessage.id,
                senderId: newMessage.sender_id,
                receiverId: newMessage.receiver_id,
            })

            // 1. Handle incoming message - updates conversation list, reorders, manages unread counts
            const { handleIncomingMessage } = useChatStore.getState()
            try {
                handleIncomingMessage(newMessage, currentUserId)
            } catch (err) {
                logger.error('handleNewMessage', 'Error handling incoming message', err)
            }

            // 2. Add message to current chat if it's the active conversation
            const { selectedUser, messages } = useChatStore.getState()
            const isGroupMessage = !!newMessage.group_id

            if (selectedUser) {
                let isActiveConversation = false

                if (isGroupMessage) {
                    // GROUP MESSAGE: Check if the current chat is this group
                    isActiveConversation = newMessage.group_id === selectedUser.id
                } else {
                    // DM MESSAGE: Check if we're chatting with the sender/receiver
                    isActiveConversation = (
                        (newMessage.sender_id === currentUserId && newMessage.receiver_id === selectedUser.id) ||
                        (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUserId)
                    )
                }

                if (isActiveConversation) {
                    // Find the optimistic message we're replacing to preserve reply_to data
                    // (Realtime doesn't include joined reply_to object)
                    const optimisticMessage = messages.find(
                        (m) =>
                            m.id.startsWith('temp-') &&
                            m.sender_id === newMessage.sender_id &&
                            (isGroupMessage ? m.group_id === newMessage.group_id : m.receiver_id === newMessage.receiver_id) &&
                            m.content === newMessage.content
                    )

                    // Debug logging for reply_to preservation
                    if (newMessage.reply_to_id) {
                        logger.debug('handleNewMessage', 'Reply message received', {
                            messageId: newMessage.id,
                            replyToId: newMessage.reply_to_id,
                            hasReplyToInPayload: !!newMessage.reply_to,
                            foundOptimistic: !!optimisticMessage,
                            optimisticHasReplyTo: !!optimisticMessage?.reply_to,
                            optimisticContent: optimisticMessage?.content,
                            newContent: newMessage.content,
                        })
                    }

                    // Enrich newMessage with reply_to from optimistic message if available
                    let enrichedMessage: DatabaseMessage = {
                        ...newMessage,
                        reply_to: newMessage.reply_to || optimisticMessage?.reply_to || null,
                    }

                    // Handle optimistic message removal
                    const withoutOptimistic = messages.filter(
                        (m) =>
                            !(
                                m.id.startsWith('temp-') &&
                                m.sender_id === newMessage.sender_id &&
                                (isGroupMessage ? m.group_id === newMessage.group_id : m.receiver_id === newMessage.receiver_id) &&
                                m.content === newMessage.content
                            )
                    )

                    // Only add if not duplicate
                    if (!withoutOptimistic.find((m) => m.id === newMessage.id)) {
                        // Add message immediately (may update later with reply_to data)
                        useChatStore.setState({ messages: [...withoutOptimistic, enrichedMessage] })
                        logger.debug('handleNewMessage', 'Added message to active chat', {
                            messageId: newMessage.id,
                            isGroup: isGroupMessage,
                            hasReplyTo: !!enrichedMessage.reply_to,
                        })

                        // If message has reply_to_id but no reply_to object, fetch it async
                        // This handles the case where the receiver gets a reply message via Realtime
                        if (newMessage.reply_to_id && !enrichedMessage.reply_to) {
                            fetchReplyToData(newMessage.reply_to_id).then((replyToData) => {
                                if (replyToData) {
                                    const { messages: currentMessages } = useChatStore.getState()
                                    const updatedMessages = currentMessages.map((m) =>
                                        m.id === newMessage.id ? { ...m, reply_to: replyToData } : m
                                    )
                                    useChatStore.setState({ messages: updatedMessages })
                                    logger.debug('handleNewMessage', 'Updated message with fetched reply_to', {
                                        messageId: newMessage.id,
                                    })
                                }
                            })
                        }
                    } else {
                        // Just remove optimistic message if real one already exists
                        useChatStore.setState({ messages: withoutOptimistic })
                    }
                }
            }

            // 3. Mark messages as delivered if we RECEIVED the message (DM only)
            // Group messages don't have delivered/seen status per-user
            if (!isGroupMessage && newMessage.receiver_id === currentUserId) {
                Promise.resolve(
                    supabase.rpc('mark_messages_delivered', { user_id: currentUserId })
                )
                    .then(({ data, error }) => {
                        if (error) {
                            logger.error('handleNewMessage', 'Failed to mark messages as delivered', error)
                        } else {
                            const count = data?.length || 0
                            logger.info('handleNewMessage', `Marked ${count} messages as delivered`)
                        }
                    })
                    .catch((err: unknown) => {
                        logger.error('handleNewMessage', 'Unexpected error marking messages as delivered', err)
                    })
            }
        } catch (err) {
            logger.error('handleNewMessage', 'Unexpected error processing new message', err)
        }
    }
}
