/**
 * Close Friends Cache Hook
 * Caches close friends status for story visibility filtering
 * 
 * @module hooks/stories/realtime/useCloseFriendsCache
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'

/**
 * Hook to cache close friends status for story visibility
 * Checks if current user is in a story owner's close friends list
 * 
 * @returns Cache functions for close friends verification
 */
export function useCloseFriendsCache() {
    const { user } = useAuthStore()
    const [cache, setCache] = useState<Map<string, boolean>>(new Map())
    const cacheRef = useRef(cache)
    const mountedRef = useRef(true)

    // Keep cacheRef in sync
    useEffect(() => {
        cacheRef.current = cache
    }, [cache])

    // Track mounted state
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    /**
     * Check if current user is in a story owner's close friends list
     * Results are cached to avoid repeated database calls
     */
    const checkIsCloseFriendOf = useCallback(async (storyOwnerId: string): Promise<boolean> => {
        // Return cached result if available (use ref to avoid dependency)
        if (cacheRef.current.has(storyOwnerId)) {
            return cacheRef.current.get(storyOwnerId)!
        }

        if (!user?.id) return false

        try {
            const { count, error } = await supabase
                .from('close_friends')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', storyOwnerId)
                .eq('friend_id', user.id)

            if (error) throw error

            const isCloseFriend = (count ?? 0) > 0

            // Update cache
            if (mountedRef.current) {
                setCache(prev => new Map(prev).set(storyOwnerId, isCloseFriend))
            }

            return isCloseFriend
        } catch (err) {
            logger.error('useCloseFriendsCache', 'Check failed', err)
            return false
        }
    }, [user?.id]) // Removed cache from dependencies

    /**
     * Invalidate entire cache
     */
    const invalidate = useCallback(() => {
        setCache(new Map())
    }, [])

    /**
     * Invalidate cache for a specific user
     */
    const invalidateUser = useCallback((userId: string) => {
        setCache(prev => {
            const newCache = new Map(prev)
            newCache.delete(userId)
            return newCache
        })
    }, [])

    return {
        checkIsCloseFriendOf,
        invalidate,
        invalidateUser,
        cacheSize: cache.size
    }
}
