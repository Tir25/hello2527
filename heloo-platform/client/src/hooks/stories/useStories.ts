/**
 * useStories Hook
 * Fetch and manage stories feed with realtime updates
 * 
 * @module hooks/stories/useStories
 */

import { useEffect, useCallback } from 'react'
import { useStoryStore } from '@/store/storyStore'
import { fetchStories, markStoryViewed } from '@/services/stories'
import { useStoriesRealtime } from './realtime'

/**
 * Hook to fetch and manage stories feed
 */
export function useStories() {
    const {
        groups,
        isLoading,
        error,
        setGroups,
        setLoading,
        setError,
        markAsViewed,
        removeGroup,
    } = useStoryStore()

    // Fetch stories on mount
    const loadStories = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await fetchStories()
            setGroups(data)
        } catch (err) {
            console.error('Failed to fetch stories:', err)
            setError(err instanceof Error ? err.message : 'Failed to load stories')
        } finally {
            setLoading(false)
        }
    }, [setGroups, setLoading, setError])

    // Initial fetch
    useEffect(() => {
        loadStories()
    }, [loadStories])

    // Enable realtime updates
    useStoriesRealtime({
        enabled: true,
        refetch: loadStories
    })

    // Mark story as viewed
    const handleStoryViewed = useCallback(async (
        storyId: string,
        userId: string
    ) => {
        // Update local state immediately
        markAsViewed(userId, storyId)

        // Sync with server (don't block UI)
        markStoryViewed(storyId).catch(console.error)
    }, [markAsViewed])

    // Remove entire group (after all stories viewed)
    const handleGroupComplete = useCallback((userId: string) => {
        removeGroup(userId)
    }, [removeGroup])

    return {
        groups,
        isLoading,
        error,
        refetch: loadStories,
        markViewed: handleStoryViewed,
        removeGroup: handleGroupComplete,
    }
}
