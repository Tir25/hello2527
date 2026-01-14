/**
 * useNewFollowers Hook
 * 
 * Fetches users who recently started following the current user
 * Includes real-time subscription for new followers
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Profile } from '@/features/profile/types/profile.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface NewFollower {
    id: string
    profile: Profile
    followedAt: string
}

interface UseNewFollowersResult {
    followers: NewFollower[]
    loading: boolean
    refetch: () => Promise<void>
}

export const useNewFollowers = (): UseNewFollowersResult => {
    const [followers, setFollowers] = useState<NewFollower[]>([])
    const [loading, setLoading] = useState(true)
    const channelRef = useRef<RealtimeChannel | null>(null)

    const fetchNewFollowers = useCallback(async () => {
        try {
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setFollowers([])
                return
            }

            // Get accepted relationships where current user is the recipient
            // These are people who FOLLOWED the current user
            const { data: relationships, error: relError } = await supabase
                .from('relationships')
                .select('id, created_at, requester_id')
                .eq('recipient_id', user.id)
                .eq('status', 'accepted')
                .eq('is_chat_request', false)
                .order('created_at', { ascending: false })
                .limit(20)

            if (relError || !relationships?.length) {
                if (relError) logger.error('useNewFollowers', 'Failed to fetch relationships', relError)
                setFollowers([])
                return
            }

            // Get profile info for each requester
            const requesterIds = relationships.map(r => r.requester_id)
            const { data: profiles, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, email, status')
                .in('id', requesterIds)

            if (profError) {
                logger.error('useNewFollowers', 'Failed to fetch profiles', profError)
                setFollowers([])
                return
            }

            // Map relationships to followers with profile data
            const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
            const mappedFollowers: NewFollower[] = relationships
                .filter(r => profileMap.has(r.requester_id))
                .map(r => {
                    const profile = profileMap.get(r.requester_id)!
                    return {
                        id: r.id,
                        followedAt: r.created_at,
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

            setFollowers(mappedFollowers)
            logger.info('useNewFollowers', `Loaded ${mappedFollowers.length} followers`)
        } catch (error) {
            logger.error('useNewFollowers', 'Unexpected error', error)
            setFollowers([])
        } finally {
            setLoading(false)
        }
    }, [])

    // Real-time subscription for new followers
    useEffect(() => {
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Clean up existing channel
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }

            const channel = supabase
                .channel(`new-followers-${user.id}`)
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
                        if (newRel.status === 'accepted') {
                            logger.info('useNewFollowers:realtime', 'New follower detected')
                            await fetchNewFollowers()
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
                    async (payload) => {
                        const updatedRel = payload.new as { status: string }
                        if (updatedRel.status === 'accepted') {
                            logger.info('useNewFollowers:realtime', 'Relationship accepted, refreshing')
                            await fetchNewFollowers()
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
                    async (payload) => {
                        const deleted = payload.old as { id: string }
                        logger.info('useNewFollowers:realtime', 'Follower removed', deleted)
                        setFollowers(prev => prev.filter(f => f.id !== deleted.id))
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        logger.info('useNewFollowers:realtime', 'Subscribed to channel')
                    }
                })

            channelRef.current = channel
        }

        setupSubscription()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current).then(() => {
                    logger.info('useNewFollowers:realtime', 'Unsubscribed')
                })
                channelRef.current = null
            }
        }
    }, [fetchNewFollowers])

    // Initial fetch
    useEffect(() => {
        fetchNewFollowers()
    }, [fetchNewFollowers])

    return {
        followers,
        loading,
        refetch: fetchNewFollowers,
    }
}
