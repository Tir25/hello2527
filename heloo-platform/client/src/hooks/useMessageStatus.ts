import { useEffect, useRef, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'

/**
 * Message Status Hook - Production Optimized v3
 * 
 * Responsibility: Automatically marks messages as "seen" when user is viewing a chat
 * Layer: Hook (Logic)
 * 
 * Performance Optimizations:
 * - Shallow selector to prevent unnecessary re-renders
 * - Early exit for empty/no-op cases
 * - Debouncing to batch rapid updates (750ms)
 * - Document visibility check (skip when tab hidden)
 * - Minimal logging in production (only log >1000ms RPCs)
 * - RPC batching for multiple messages
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

// Debounce delay for batching rapid message arrivals (increased for better batching)
const MARK_SEEN_DEBOUNCE_MS = 750

// Threshold for logging slow RPC calls (raised to reduce noise)
const SLOW_RPC_THRESHOLD_MS = 1000

export const useMessageStatus = ({ selectedUserId, currentUserId }: UseMessageStatusProps): void => {
    // CRITICAL: All hooks MUST be called unconditionally at the top
    // Cannot have early returns before hooks - violates Rules of Hooks

    // OPTIMIZED: Use shallow selector to only re-render when message IDs change
    const messageCount = useChatStore((state) => state.messages.length)
    const getMessages = useCallback(() => useChatStore.getState().messages, [])

    const processedMessageIdsRef = useRef<Set<string>>(new Set())
    const markSeenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastProcessedCountRef = useRef(0)

    // OPTIMIZED: Only compute unseen IDs when we actually have new messages
    const unseenMessageIds = useMemo(() => {
        // Early exit - no users selected
        if (!selectedUserId || !currentUserId) {
            return []
        }

        // Early exit - no new messages since last check
        if (messageCount === lastProcessedCountRef.current) {
            return []
        }

        lastProcessedCountRef.current = messageCount

        const messages = getMessages()

        // OPTIMIZED: Single pass filter+map
        const unseen: string[] = []
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i]
            if (msg.sender_id === selectedUserId && msg.status !== 'seen') {
                unseen.push(msg.id)
            }
            // Early exit - found enough recent unseen messages (optimization for large lists)
            if (unseen.length >= 50) break
        }

        return unseen
    }, [messageCount, selectedUserId, currentUserId, getMessages])

    useEffect(() => {
        // Guard clause - exit early if no users selected
        if (!selectedUserId || !currentUserId) {
            // Reset processed messages when chat closes
            processedMessageIdsRef.current.clear()
            return
        }

        // Find unseen messages that haven't been processed yet
        const unprocessedMessageIds = unseenMessageIds.filter(
            (id) => !processedMessageIdsRef.current.has(id)
        )

        // Early exit - nothing to process
        if (unprocessedMessageIds.length === 0) {
            return
        }

        // Mark these message IDs as processed immediately to prevent duplicate calls
        unprocessedMessageIds.forEach((id) => processedMessageIdsRef.current.add(id))

        // Clear existing timeout (debounce)
        if (markSeenTimeoutRef.current) {
            clearTimeout(markSeenTimeoutRef.current)
        }

        // OPTIMIZED: Longer debounce (750ms) to batch more messages together
        markSeenTimeoutRef.current = setTimeout(async () => {
            // Skip if document is hidden (user switched tabs)
            if (document.hidden) {
                // Messages will be marked when user returns to tab
                unprocessedMessageIds.forEach((id) => processedMessageIdsRef.current.delete(id))
                return
            }

            const rpcStartTime = performance.now()

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

                // Only log truly slow RPC calls (>1000ms) in production
                if (rpcDuration > SLOW_RPC_THRESHOLD_MS) {
                    logger.warn('useMessageStatus:performance', `Slow RPC call: ${rpcDuration.toFixed(2)}ms`, {
                        messageCount: count
                    })
                }

                // Clear unread count for this conversation
                useChatStore.getState().clearUnreadCount(selectedUserId)
            } catch (err: unknown) {
                logger.error('useMessageStatus', 'Unexpected error marking messages as seen', err)
                // Remove from processed set on error so we can retry
                unprocessedMessageIds.forEach((id) => processedMessageIdsRef.current.delete(id))
            }
        }, MARK_SEEN_DEBOUNCE_MS)

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
            lastProcessedCountRef.current = 0
            if (markSeenTimeoutRef.current) {
                clearTimeout(markSeenTimeoutRef.current)
            }
        }
    }, [])
}
