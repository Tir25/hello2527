/**
 * Stories Realtime Hook
 * Main hook for realtime story updates
 * 
 * @module hooks/stories/realtime/useStoriesRealtime
 */

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useStoryStore } from '@/store/storyStore'
import { logger } from '@/lib/logger'
import { useRelationshipCache } from './useRelationshipCache'
import { useCloseFriendsCache } from './useCloseFriendsCache'
import { clearDebounceTimeout } from './useDebounce'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
    UseStoriesRealtimeOptions,
    StoryInsertPayload,
    StoryDeletePayload
} from './types'

const DEBOUNCE_MS = 1000
const CLEANUP_DELAY_MS = 100

/**
 * Hook for realtime story updates
 * Subscribes to INSERT and DELETE events on stories table
 * Filters events based on relationship and close friends status
 */
export function useStoriesRealtime({
    enabled,
    refetch
}: UseStoriesRealtimeOptions): void {
    const { user } = useAuthStore()
    const isViewerOpen = useStoryStore(s => s.viewer.isOpen)

    // Cache hooks
    const { hasAcceptedRelationship, invalidate: invalidateRelationships } = useRelationshipCache()
    const { checkIsCloseFriendOf } = useCloseFriendsCache()

    // Refs for lifecycle management
    const channelRef = useRef<RealtimeChannel | null>(null)
    const relationshipChannelRef = useRef<RealtimeChannel | null>(null)
    const subscribedUserIdRef = useRef<string | null>(null)
    const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRefreshRef = useRef(false)
    const mountedRef = useRef(true)

    // Use refs to avoid stale closures in event handlers
    // These refs are updated on every render so event handlers always have current values
    const isViewerOpenRef = useRef(isViewerOpen)
    const hasAcceptedRelationshipRef = useRef(hasAcceptedRelationship)
    const checkIsCloseFriendOfRef = useRef(checkIsCloseFriendOf)
    const userIdRef = useRef(user?.id)
    const refetchRef = useRef(refetch)

    // Sync refs with current values
    useEffect(() => {
        isViewerOpenRef.current = isViewerOpen
        hasAcceptedRelationshipRef.current = hasAcceptedRelationship
        checkIsCloseFriendOfRef.current = checkIsCloseFriendOf
        userIdRef.current = user?.id
        refetchRef.current = refetch
    })

    // Track mounted state and clear any pending cleanup
    useEffect(() => {
        mountedRef.current = true
        // Clear any cleanup timeout from previous unmount
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current)
            cleanupTimeoutRef.current = null
        }
        return () => { mountedRef.current = false }
    }, [])

    // Debounced refetch (uses ref to avoid stale closure)
    const debouncedRefetch = useCallback(() => {
        clearDebounceTimeout(debounceTimeoutRef)
        debounceTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
                refetchRef.current()
            }
        }, DEBOUNCE_MS)
    }, []) // No dependencies - refetch accessed via ref

    // Handle pending refresh when viewer closes
    useEffect(() => {
        if (!isViewerOpen && pendingRefreshRef.current) {
            pendingRefreshRef.current = false
            refetchRef.current()
        }
    }, [isViewerOpen])

    // Check if current user can view a story (uses refs to avoid stale closures)
    const canViewStory = useCallback(async (
        storyUserId: string,
        audienceType: string | null
    ): Promise<boolean> => {
        // Skip own stories (use ref for current value)
        if (storyUserId === userIdRef.current) {
            logger.debug('useStoriesRealtime', 'canViewStory: skipping own story')
            return false
        }

        // Must have accepted relationship (use ref for current function)
        const hasRelationship = hasAcceptedRelationshipRef.current(storyUserId)
        logger.debug('useStoriesRealtime', 'canViewStory: relationship check', {
            storyUserId,
            hasRelationship
        })

        if (!hasRelationship) {
            return false
        }

        // Public story - visible
        if (!audienceType || audienceType === 'public') {
            return true
        }

        // Close friends story - verify (use ref for current function)
        if (audienceType === 'close_friends') {
            const isCloseFriend = await checkIsCloseFriendOfRef.current(storyUserId)
            logger.debug('useStoriesRealtime', 'canViewStory: close friends check', {
                storyUserId,
                isCloseFriend
            })
            return isCloseFriend
        }

        return false
    }, []) // No dependencies - all values accessed via refs

    // Main subscription effect
    useEffect(() => {
        if (!enabled || !user?.id) return

        // Prevent channel churn
        if (user.id === subscribedUserIdRef.current) return

        // Cleanup existing channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
        }

        subscribedUserIdRef.current = user.id

        const channel = supabase
            .channel(`stories-realtime-${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'stories' },
                async (payload) => {
                    if (!mountedRef.current) return

                    const newStory = payload.new as StoryInsertPayload
                    logger.info('useStoriesRealtime', 'INSERT received', {
                        storyId: newStory.id,
                        storyUserId: newStory.user_id,
                        audienceType: newStory.audience_type,
                        currentUserId: user?.id
                    })

                    const canView = await canViewStory(newStory.user_id, newStory.audience_type)

                    logger.info('useStoriesRealtime', 'canViewStory result', {
                        storyUserId: newStory.user_id,
                        canView,
                        isOwnStory: newStory.user_id === user?.id
                    })

                    if (!canView) {
                        logger.info('useStoriesRealtime', 'Story filtered - not viewable')
                        return
                    }

                    // Defer if viewer open (use ref to avoid stale closure)
                    if (isViewerOpenRef.current) {
                        pendingRefreshRef.current = true
                        logger.debug('useStoriesRealtime', 'Refresh deferred')
                        return
                    }

                    logger.info('useStoriesRealtime', 'New visible story')
                    debouncedRefetch()
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'stories' },
                (payload) => {
                    if (!mountedRef.current) return

                    const deleted = payload.old as StoryDeletePayload
                    logger.info('useStoriesRealtime', 'Story deleted', { id: deleted.id })
                    useStoryStore.getState().removeStory(deleted.id)
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger.info('useStoriesRealtime', 'Subscribed')
                } else if (status === 'CHANNEL_ERROR') {
                    logger.error('useStoriesRealtime', 'Channel error')
                }
            })

        channelRef.current = channel

        // Cleanup with debounce
        return () => {
            clearDebounceTimeout(cleanupTimeoutRef)
            clearDebounceTimeout(debounceTimeoutRef)

            cleanupTimeoutRef.current = setTimeout(() => {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current)
                    channelRef.current = null
                }
                subscribedUserIdRef.current = null
            }, CLEANUP_DELAY_MS)
        }
    }, [enabled, user?.id, canViewStory, debouncedRefetch])

    // Subscribe to relationship changes
    useEffect(() => {
        if (!enabled || !user?.id) return

        const channel = supabase
            .channel(`stories-relationships-${user.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'relationships' },
                () => {
                    logger.info('useStoriesRealtime', 'Relationship changed')
                    invalidateRelationships()
                }
            )
            .subscribe()

        relationshipChannelRef.current = channel

        return () => {
            if (relationshipChannelRef.current) {
                supabase.removeChannel(relationshipChannelRef.current)
                relationshipChannelRef.current = null
            }
        }
    }, [enabled, user?.id, invalidateRelationships])
}
