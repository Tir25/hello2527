/**
 * useProfileRealtime Hook
 * 
 * Real-time subscription for relationship status changes on a profile page
 * Updates when relationship status changes (pending → accepted, etc.)
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseProfileRealtimeOptions {
    profileId: string
    currentUserId: string | undefined
    enabled: boolean
    onRelationshipChange: () => void
}

export const useProfileRealtime = ({
    profileId,
    currentUserId,
    enabled,
    onRelationshipChange,
}: UseProfileRealtimeOptions): void => {
    const channelRef = useRef<RealtimeChannel | null>(null)
    const onChangeRef = useRef(onRelationshipChange)

    // Keep the callback ref updated
    useEffect(() => {
        onChangeRef.current = onRelationshipChange
    }, [onRelationshipChange])

    useEffect(() => {
        if (!enabled || !currentUserId || !profileId || currentUserId === profileId) {
            return
        }

        const setupSubscription = async () => {
            // Clean up existing channel
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }

            // Subscribe to relationship changes where:
            // - Current user is requester and profile is recipient, OR
            // - Current user is recipient and profile is requester
            const channel = supabase
                .channel(`profile-relationship-${currentUserId}-${profileId}`)
                // When current user sent request and profile user updates it
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'relationships',
                        filter: `requester_id=eq.${currentUserId}`,
                    },
                    (payload) => {
                        const updated = payload.new as { recipient_id: string; status: string }
                        if (updated.recipient_id === profileId) {
                            logger.info('useProfileRealtime', `Relationship updated to ${updated.status}`)
                            onChangeRef.current()
                        }
                    }
                )
                // When profile user sent request and current user updates it
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'relationships',
                        filter: `requester_id=eq.${profileId}`,
                    },
                    (payload) => {
                        const updated = payload.new as { recipient_id: string; status: string }
                        if (updated.recipient_id === currentUserId) {
                            logger.info('useProfileRealtime', `Incoming relationship updated to ${updated.status}`)
                            onChangeRef.current()
                        }
                    }
                )
                // When new relationship is created
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'relationships',
                    },
                    (payload) => {
                        const newRel = payload.new as { requester_id: string; recipient_id: string }
                        if (
                            (newRel.requester_id === currentUserId && newRel.recipient_id === profileId) ||
                            (newRel.requester_id === profileId && newRel.recipient_id === currentUserId)
                        ) {
                            logger.info('useProfileRealtime', 'New relationship created')
                            onChangeRef.current()
                        }
                    }
                )
                // When relationship is deleted
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'relationships',
                    },
                    (payload) => {
                        const deleted = payload.old as { requester_id: string; recipient_id: string }
                        if (
                            (deleted.requester_id === currentUserId && deleted.recipient_id === profileId) ||
                            (deleted.requester_id === profileId && deleted.recipient_id === currentUserId)
                        ) {
                            logger.info('useProfileRealtime', 'Relationship deleted')
                            onChangeRef.current()
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        logger.info('useProfileRealtime', 'Subscribed to profile relationship changes')
                    }
                })

            channelRef.current = channel
        }

        setupSubscription()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current).then(() => {
                    logger.info('useProfileRealtime', 'Unsubscribed from profile relationship')
                })
                channelRef.current = null
            }
        }
    }, [enabled, currentUserId, profileId])
}
