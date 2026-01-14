/**
 * usePinnedMessages Hook
 *
 * Manages fetching and unpinning of pinned messages for a conversation.
 * @module components/chat/pins/usePinnedMessages
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PinnedMessage, UsePinnedMessagesReturn } from './types'

interface UsePinnedMessagesProps {
    conversationId: string
    currentUserId?: string
    isGroup?: boolean
}

/**
 * Hook to fetch and manage pinned messages for a conversation
 */
export function usePinnedMessages({
    conversationId,
    currentUserId,
    isGroup = false,
}: UsePinnedMessagesProps): UsePinnedMessagesReturn {
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [unpinning, setUnpinning] = useState<string | null>(null)

    // Fetch pinned messages
    useEffect(() => {
        if (!conversationId) {
            setLoading(false)
            return
        }

        const fetchPinnedMessages = async () => {
            setLoading(true)
            try {
                let query

                if (isGroup) {
                    // Group messages - query by group_id
                    query = supabase
                        .from('messages')
                        .select(`
                            id,
                            content,
                            sender_id,
                            pinned_at,
                            pinned_by,
                            profiles!messages_sender_id_fkey(username)
                        `)
                        .eq('group_id', conversationId)
                        .not('pinned_at', 'is', null)
                        .order('pinned_at', { ascending: false })
                } else {
                    // DM messages - query by conversation participants
                    query = supabase
                        .from('messages')
                        .select(`
                            id,
                            content,
                            sender_id,
                            pinned_at,
                            pinned_by,
                            profiles!messages_sender_id_fkey(username)
                        `)
                        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${currentUserId})`)
                        .not('pinned_at', 'is', null)
                        .order('pinned_at', { ascending: false })
                }

                const { data, error } = await query

                if (error) {
                    console.error('Error fetching pinned messages:', error)
                    setPinnedMessages([])
                } else {
                    const mapped: PinnedMessage[] = (data || []).map((msg: any) => ({
                        id: msg.id,
                        content: msg.content,
                        sender_id: msg.sender_id,
                        pinned_at: msg.pinned_at,
                        pinned_by: msg.pinned_by,
                        sender_name: msg.profiles?.username || 'Unknown',
                    }))
                    setPinnedMessages(mapped)
                }
            } catch (err) {
                console.error('Error fetching pinned messages:', err)
                setPinnedMessages([])
            } finally {
                setLoading(false)
            }
        }

        fetchPinnedMessages()
    }, [conversationId, currentUserId, isGroup])

    // Handle unpin
    const handleUnpin = useCallback(async (messageId: string) => {
        setUnpinning(messageId)
        try {
            const { error } = await supabase
                .from('messages')
                .update({ pinned_at: null, pinned_by: null })
                .eq('id', messageId)

            if (error) {
                console.error('Error unpinning message:', error)
            } else {
                setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId))
            }
        } catch (err) {
            console.error('Error unpinning message:', err)
        } finally {
            setUnpinning(null)
        }
    }, [])

    return {
        pinnedMessages,
        loading,
        unpinning,
        handleUnpin,
    }
}
