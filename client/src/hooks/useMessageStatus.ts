import { useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'

/**
 * Message Status Hook - Production Optimized (Fixed)
 * 
 * Responsibility: Automatically marks messages as "seen" when user is viewing a chat
 * Layer: Hook (Logic)
 * 
 * Performance Optimizations:
 * - Memoized computation of unseen message IDs
 * - Debouncing to batch rapid updates
 * - Conditional debug logging (dev-only)
 * - Performance tracking for slow operations
 * 
 * Features:
 * - Detects unseen messages from selected chat
 * - Calls database RPC to mark as seen
 * - Clears unread count in store
 * - Handles cleanup and errors
 * - Tracks processed messages to prevent duplicates
 */

interface UseMessageStatusProps {
    selectedUserId: string | null
    currentUserId: string | null
}

export const useMessageStatus = ({ selectedUserId, currentUserId }: UseMessageStatusProps): void => {
    // CRITICAL: All hooks MUST be called unconditionally at the top
    // Cannot have early returns before hooks - violates Rules of Hooks
    const messages = useChatStore((state) => state.messages)
    const processedMessageIdsRef = useRef<Set<string>>(new Set())
    const markSeenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // OPTIMIZED: Memoize unseen message IDs to prevent unnecessary re-computation
    // Only recomputes when messages array, selectedUserId, or currentUserId changes
    const unseenMessageIds = useMemo(() => {
        // Early exit in useMemo is fine - doesn't affect hook order
        if (!selectedUserId || !currentUserId) {
            return []
        }

        const startTime = performance.now()

        const unseen = messages
            .filter((msg) => msg.sender_id === selectedUserId && msg.status !== 'seen')
            .map((msg) => msg.id)

        const duration = performance.now() - startTime

        // Log slow computations (>10ms is concerning for a filter/map operation)
        if (duration > 10) {
            logger.warn('useMessageStatus:performance', `Slow unseen message computation: ${duration.toFixed(2)}ms`, {
                messageCount: messages.length,
                unseenCount: unseen.length
            })
        }

        logger.debug('useMessageStatus:useMemo', `Found ${unseen.length} unseen messages`, {
            unseenIds: unseen,
            totalMessages: messages.length,
            computationTime: `${duration.toFixed(2)}ms`
        })

        return unseen
    }, [messages, selectedUserId, currentUserId])

    useEffect(() => {
        // Guard clause - exit early if no users selected
        if (!selectedUserId || !currentUserId) {
            // Reset processed messages when chat closes
            processedMessageIdsRef.current.clear()
            logger.debug('useMessageStatus', 'No users selected, cleared processed messages')
            return
        }

        // Find unseen messages that haven't been processed yet
        const unprocessedMessageIds = unseenMessageIds.filter(
            (id) => !processedMessageIdsRef.current.has(id)
        )

        if (unprocessedMessageIds.length === 0) {
            logger.debug('useMessageStatus', 'No new unseen messages to process')
            return
        }

        logger.info('useMessageStatus', `Found ${unprocessedMessageIds.length} unseen messages to mark as seen`, {
            messageIds: unprocessedMessageIds,
            senderId: selectedUserId,
            receiverId: currentUserId
        })

        // Mark these message IDs as processed immediately to prevent duplicate calls
        unprocessedMessageIds.forEach((id) => processedMessageIdsRef.current.add(id))

        // Debounce to batch rapid message arrivals (300ms)
        if (markSeenTimeoutRef.current) {
            clearTimeout(markSeenTimeoutRef.current)
        }

        markSeenTimeoutRef.current = setTimeout(async () => {
            const rpcStartTime = performance.now()

            logger.info('useMessageStatus', 'Calling mark_messages_seen RPC', {
                sender_id: selectedUserId,
                receiver_id: currentUserId,
                messageCount: unprocessedMessageIds.length
            })

            try {
                const { data, error } = await supabase.rpc('mark_messages_seen', {
                    sender_id_param: selectedUserId,
                    receiver_id_param: currentUserId,
                })

                const rpcDuration = performance.now() - rpcStartTime

                if (error) {
                    logger.error('useMessageStatus', 'Failed to mark messages as seen', error)
                    // Remove from processed set on error so we can retry
                    unprocessedMessageIds.forEach((id) => processedMessageIdsRef.current.delete(id))
                    return
                }

                const count = data?.length || 0

                // Log slow RPC calls (>500ms)
                if (rpcDuration > 500) {
                    logger.warn('useMessageStatus:performance', `Slow RPC call: ${rpcDuration.toFixed(2)}ms`, {
                        messageCount: count
                    })
                }

                logger.info('useMessageStatus', `Successfully marked ${count} messages as seen in ${rpcDuration.toFixed(2)}ms`, {
                    updatedMessageIds: data?.map((m: any) => m.id) || [],
                    rpcDuration: `${rpcDuration.toFixed(2)}ms`
                })

                // Clear unread count for this conversation
                useChatStore.getState().clearUnreadCount(selectedUserId)
            } catch (err: unknown) {
                logger.error('useMessageStatus', 'Unexpected error marking messages as seen', err)
                // Remove from processed set on error so we can retry
                unprocessedMessageIds.forEach((id) => processedMessageIdsRef.current.delete(id))
            }
        }, 300)

        // Cleanup timeout on unmount or dependency change
        return () => {
            if (markSeenTimeoutRef.current) {
                clearTimeout(markSeenTimeoutRef.current)
                markSeenTimeoutRef.current = null
            }
        }
    }, [selectedUserId, currentUserId, unseenMessageIds])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            processedMessageIdsRef.current.clear()
            if (markSeenTimeoutRef.current) {
                clearTimeout(markSeenTimeoutRef.current)
            }
        }
    }, [])
}
