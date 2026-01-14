/**
 * usePinMessage Hook
 * 
 * Hook for pinning/unpinning messages in group chats.
 * 
 * @module hooks/chat/usePinMessage
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

interface UsePinMessageResult {
    pinMessage: (messageId: string) => Promise<boolean>
    unpinMessage: (messageId: string) => Promise<boolean>
    isPinning: boolean
}

/**
 * Hook for managing message pins
 */
export const usePinMessage = (): UsePinMessageResult => {
    const [isPinning, setIsPinning] = useState(false)
    const { user } = useAuthStore()

    const pinMessage = useCallback(async (messageId: string): Promise<boolean> => {
        if (!user?.id) {
            toast.error('You must be logged in')
            return false
        }

        logger.info('usePinMessage', 'Attempting to pin message', { messageId, userId: user.id })
        setIsPinning(true)
        try {
            const { data, error, count } = await supabase
                .from('messages')
                .update({
                    is_pinned: true,
                    pinned_at: new Date().toISOString(),
                    pinned_by: user.id,
                })
                .eq('id', messageId)
                .select()

            logger.info('usePinMessage', 'Pin update result', { data, error, count, messageId })

            if (error) throw error

            if (!data || data.length === 0) {
                logger.warn('usePinMessage', 'No rows updated - message may not exist or RLS blocked', { messageId })
            }

            toast.success('Message pinned')
            return true
        } catch (err) {
            logger.error('usePinMessage', 'Failed to pin message', err)
            toast.error('Failed to pin message')
            return false
        } finally {
            setIsPinning(false)
        }
    }, [user?.id])

    const unpinMessage = useCallback(async (messageId: string): Promise<boolean> => {
        setIsPinning(true)
        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    is_pinned: false,
                    pinned_at: null,
                    pinned_by: null,
                })
                .eq('id', messageId)

            if (error) throw error

            toast.success('Message unpinned')
            return true
        } catch (err) {
            logger.error('usePinMessage', 'Failed to unpin message', err)
            toast.error('Failed to unpin message')
            return false
        } finally {
            setIsPinning(false)
        }
    }, [])

    return {
        pinMessage,
        unpinMessage,
        isPinning,
    }
}
