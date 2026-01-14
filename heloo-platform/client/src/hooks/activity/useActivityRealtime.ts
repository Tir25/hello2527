/**
 * useActivityRealtime Hook
 * 
 * Responsibility: Manage real-time subscriptions for relationship changes
 * Layer: Data (Hook)
 * 
 * Features:
 * - Subscribe to new incoming requests (INSERT)
 * - Subscribe to request updates (UPDATE)
 * - Subscribe to request deletions (DELETE)
 * - Automatic cleanup on unmount
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/lib/services/profile.service'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { IncomingRequest } from './types'

interface UseActivityRealtimeOptions {
    enabled: boolean
    setRequests: React.Dispatch<React.SetStateAction<IncomingRequest[]>>
}

export const useActivityRealtime = ({
    enabled,
    setRequests,
}: UseActivityRealtimeOptions): void => {
    const channelRef = useRef<RealtimeChannel | null>(null)

    useEffect(() => {
        if (!enabled) return

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Clean up existing channel
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }

            // Subscribe to relationships
            const channel = supabase
                .channel(`incoming-requests-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'relationships',
                        filter: `recipient_id=eq.${user.id}`,
                    },
                    async (payload) => {
                        const newRel = payload.new as { status: string }
                        if (newRel.status === 'pending') {
                            logger.info('useActivityRealtime', 'New request received')
                            const result = await profileService.getIncomingRequests()
                            if (result.success && result.data) {
                                setRequests(result.data)
                            }
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'relationships',
                        filter: `recipient_id=eq.${user.id}`,
                    },
                    async () => {
                        const result = await profileService.getIncomingRequests()
                        if (result.success && result.data) {
                            setRequests(result.data)
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'relationships',
                        filter: `recipient_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const deleted = payload.old as { id: string }
                        logger.info('useActivityRealtime', 'Request deleted', deleted)
                        setRequests((prev) => prev.filter((r) => r.relationship_id !== deleted.id))
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        logger.info('useActivityRealtime', 'Subscribed to channel')
                    }
                })

            channelRef.current = channel
        }

        setupSubscription()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current).then(() => {
                    logger.info('useActivityRealtime', 'Unsubscribed from channel')
                })
                channelRef.current = null
            }
        }
    }, [enabled, setRequests])
}
