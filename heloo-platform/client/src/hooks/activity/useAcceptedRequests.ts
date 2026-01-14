/**
 * useAcceptedRequests Hook
 * 
 * Fetches when YOUR follow requests were accepted by others
 * Shows "X accepted your follow request" notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Profile } from '@/features/profile/types/profile.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface AcceptedRequest {
    id: string
    profile: Profile
    acceptedAt: string
}

interface UseAcceptedRequestsResult {
    accepted: AcceptedRequest[]
    loading: boolean
    refetch: () => Promise<void>
}

export const useAcceptedRequests = (): UseAcceptedRequestsResult => {
    const [accepted, setAccepted] = useState<AcceptedRequest[]>([])
    const [loading, setLoading] = useState(true)
    const channelRef = useRef<RealtimeChannel | null>(null)

    const fetchAccepted = useCallback(async () => {
        try {
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setAccepted([])
                return
            }

            // Get relationships where current user is the REQUESTER and status is accepted
            // These are people who ACCEPTED your follow request
            const { data: relationships, error: relError } = await supabase
                .from('relationships')
                .select('id, updated_at, recipient_id')
                .eq('requester_id', user.id)
                .eq('status', 'accepted')
                .eq('is_chat_request', false)
                .order('updated_at', { ascending: false })
                .limit(20)

            if (relError || !relationships?.length) {
                if (relError) logger.error('useAcceptedRequests', 'Failed to fetch', relError)
                setAccepted([])
                return
            }

            // Get profile info for each recipient
            const recipientIds = relationships.map(r => r.recipient_id)
            const { data: profiles, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, email, status')
                .in('id', recipientIds)

            if (profError) {
                logger.error('useAcceptedRequests', 'Failed to fetch profiles', profError)
                setAccepted([])
                return
            }

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
            const mapped: AcceptedRequest[] = relationships
                .filter(r => profileMap.has(r.recipient_id))
                .map(r => {
                    const profile = profileMap.get(r.recipient_id)!
                    return {
                        id: r.id,
                        acceptedAt: r.updated_at,
                        profile: {
                            id: profile.id,
                            full_name: profile.full_name,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                            email: profile.email,
                            status: profile.status,
                            phone: null,
                            last_seen: null,
                            created_at: null,
                        },
                    }
                })

            setAccepted(mapped)
            logger.info('useAcceptedRequests', `Loaded ${mapped.length} accepted requests`)
        } catch (error) {
            logger.error('useAcceptedRequests', 'Unexpected error', error)
            setAccepted([])
        } finally {
            setLoading(false)
        }
    }, [])

    // Real-time subscription
    useEffect(() => {
        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current)
            }

            const channel = supabase
                .channel(`accepted-requests-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'relationships',
                        filter: `requester_id=eq.${user.id}`,
                    },
                    async (payload) => {
                        const updated = payload.new as { status: string }
                        if (updated.status === 'accepted') {
                            logger.info('useAcceptedRequests:realtime', 'Request accepted!')
                            await fetchAccepted()
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        logger.info('useAcceptedRequests:realtime', 'Subscribed')
                    }
                })

            channelRef.current = channel
        }

        setup()
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [fetchAccepted])

    useEffect(() => {
        fetchAccepted()
    }, [fetchAccepted])

    return { accepted, loading, refetch: fetchAccepted }
}
