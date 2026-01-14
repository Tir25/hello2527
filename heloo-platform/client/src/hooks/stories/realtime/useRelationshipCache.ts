/**
 * Relationship Cache Hook
 * Caches user relationships for efficient story filtering
 * 
 * @module hooks/stories/realtime/useRelationshipCache
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'

/**
 * Hook to cache relationships for story visibility filtering
 * Fetches both directions (as requester and recipient) for asymmetric support
 * 
 * @returns Map of user IDs to relationship status
 */
export function useRelationshipCache() {
    const { user } = useAuthStore()
    const [relationships, setRelationships] = useState<Map<string, string>>(new Map())
    const [isLoading, setIsLoading] = useState(true)
    const mountedRef = useRef(true)

    // Track mounted state
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // Fetch all relationships involving current user
    const fetchRelationships = useCallback(async () => {
        if (!user?.id) return

        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from('relationships')
                .select('requester_id, recipient_id, status')
                .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

            if (error) throw error

            const userMap = new Map<string, string>()

            data?.forEach(rel => {
                const otherUserId = rel.requester_id === user.id
                    ? rel.recipient_id
                    : rel.requester_id
                userMap.set(otherUserId, rel.status)
            })

            if (mountedRef.current) {
                setRelationships(userMap)
                logger.info('useRelationshipCache', `Cached ${userMap.size} relationships`)
            }
        } catch (err) {
            logger.error('useRelationshipCache', 'Failed to fetch relationships', err)
        } finally {
            if (mountedRef.current) {
                setIsLoading(false)
            }
        }
    }, [user?.id])

    // Initial fetch
    useEffect(() => {
        fetchRelationships()
    }, [fetchRelationships])

    // Invalidate cache (called when relationship changes)
    const invalidate = useCallback(() => {
        setRelationships(new Map())
        fetchRelationships()
    }, [fetchRelationships])

    // Check if user has accepted relationship
    const hasAcceptedRelationship = useCallback((userId: string): boolean => {
        return relationships.get(userId) === 'accepted'
    }, [relationships])

    // Check if user is blocked
    const isBlocked = useCallback((userId: string): boolean => {
        return relationships.get(userId) === 'blocked'
    }, [relationships])

    return {
        relationships,
        isLoading,
        invalidate,
        hasAcceptedRelationship,
        isBlocked
    }
}
