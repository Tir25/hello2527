/**
 * Story Store
 * Zustand store for story state management
 * 
 * @module store/storyStore
 */

import { create } from 'zustand'
import type { StoryGroup, ViewerState } from '@/types'

interface StoryState {
    // Feed state
    groups: StoryGroup[]
    /** Viewed story IDs mapped to true for O(1) lookup - serializable unlike Set */
    viewedStoryIds: Record<string, boolean>
    isLoading: boolean
    error: string | null

    // Viewer state
    viewer: ViewerState
    isCreatorOpen: boolean

    // Actions
    setGroups: (groups: StoryGroup[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setCreatorOpen: (open: boolean) => void

    // Viewer actions
    openViewer: (groupIndex: number, storyIndex?: number) => void
    closeViewer: () => void
    nextStory: () => boolean
    prevStory: () => boolean
    nextGroup: () => boolean
    prevGroup: () => boolean
    togglePause: () => void
    toggleMute: () => void

    // Story management
    markAsViewed: (userId: string, storyId: string) => void
    removeStory: (storyId: string) => void
    removeGroup: (userId: string) => void

    // Story navigation by ID (for DM story mentions)
    openStoryById: (storyId: string, ownerId: string) => boolean
    refreshAndOpenStory: (storyId: string, ownerId: string) => Promise<boolean>
}

export const useStoryStore = create<StoryState>((set, get) => ({
    // Initial state
    groups: [],
    viewedStoryIds: {},
    isLoading: false,
    error: null,

    viewer: {
        isOpen: false,
        currentGroupIndex: 0,
        currentStoryIndex: 0,
        isPaused: false,
        isMuted: false,
    },
    isCreatorOpen: false,

    // Basic setters
    setGroups: (groups) => set({ groups }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setCreatorOpen: (isCreatorOpen) => set({ isCreatorOpen }),

    // Viewer controls
    openViewer: (groupIndex, storyIndex = 0) => set({
        viewer: {
            isOpen: true,
            currentGroupIndex: groupIndex,
            currentStoryIndex: storyIndex,
            isPaused: false,
            isMuted: false,
        }
    }),

    closeViewer: () => set((state) => ({
        viewer: { ...state.viewer, isOpen: false }
    })),

    nextStory: () => {
        const { groups, viewer } = get()
        const currentGroup = groups[viewer.currentGroupIndex]

        if (!currentGroup) return false

        if (viewer.currentStoryIndex < currentGroup.stories.length - 1) {
            set((state) => ({
                viewer: {
                    ...state.viewer,
                    currentStoryIndex: state.viewer.currentStoryIndex + 1
                }
            }))
            return true
        }

        // At last story - return false to let caller handle group navigation
        return false
    },

    prevStory: () => {
        const { viewer } = get()

        if (viewer.currentStoryIndex > 0) {
            set((state) => ({
                viewer: {
                    ...state.viewer,
                    currentStoryIndex: state.viewer.currentStoryIndex - 1
                }
            }))
            return true
        }

        // At first story - return false to let caller handle group navigation
        return false
    },

    nextGroup: () => {
        const { groups, viewer } = get()

        if (viewer.currentGroupIndex < groups.length - 1) {
            set((state) => ({
                viewer: {
                    ...state.viewer,
                    currentGroupIndex: state.viewer.currentGroupIndex + 1,
                    currentStoryIndex: 0
                }
            }))
            return true
        }

        // No more groups, close viewer
        get().closeViewer()
        return false
    },

    prevGroup: () => {
        const { viewer } = get()

        if (viewer.currentGroupIndex > 0) {
            const prevGroup = get().groups[viewer.currentGroupIndex - 1]
            set((state) => ({
                viewer: {
                    ...state.viewer,
                    currentGroupIndex: state.viewer.currentGroupIndex - 1,
                    currentStoryIndex: prevGroup ? prevGroup.stories.length - 1 : 0
                }
            }))
            return true
        }

        return false
    },

    togglePause: () => set((state) => ({
        viewer: { ...state.viewer, isPaused: !state.viewer.isPaused }
    })),

    toggleMute: () => set((state) => ({
        viewer: { ...state.viewer, isMuted: !state.viewer.isMuted }
    })),

    // Mark story as viewed in local state
    markAsViewed: (userId, storyId) => set((state) => {
        // Add to viewed record (serializable)
        const newViewedIds = { ...state.viewedStoryIds, [storyId]: true }

        // Update hasUnviewed for the relevant group
        const updatedGroups = state.groups.map(group => {
            if (group.userId !== userId) return group

            // Check if all stories in group are now viewed
            const hasUnviewed = group.stories.some(s => !newViewedIds[s.id])

            return {
                ...group,
                hasUnviewed
            }
        })

        return {
            groups: updatedGroups,
            viewedStoryIds: newViewedIds
        }
    }),

    // Remove a specific story from local state (after deletion)
    removeStory: (storyId) => set((state) => {
        const updatedGroups = state.groups.map(group => {
            const filteredStories = group.stories.filter(s => s.id !== storyId)

            // If no stories left in this group, return null to filter out later
            if (filteredStories.length === 0) {
                return null
            }

            return {
                ...group,
                stories: filteredStories
            }
        }).filter((g): g is StoryGroup => g !== null)

        return { groups: updatedGroups }
    }),

    // Remove group from feed (after all stories viewed)
    removeGroup: (userId) => set((state) => ({
        groups: state.groups.filter(g => g.userId !== userId)
    })),

    // Open story by ID (for DM story mentions)
    openStoryById: (storyId: string, ownerId: string) => {
        const { groups, openViewer } = get()

        // Find group by owner ID
        const groupIndex = groups.findIndex(g => g.userId === ownerId)
        if (groupIndex === -1) return false

        const group = groups[groupIndex]
        const storyIndex = group.stories.findIndex(s => s.id === storyId)
        if (storyIndex === -1) return false

        // Open viewer at this position
        openViewer(groupIndex, storyIndex)
        return true
    },

    // Refresh stories and try to open by ID
    refreshAndOpenStory: async (storyId: string, ownerId: string) => {
        const state = get()

        // First try current store
        if (state.openStoryById(storyId, ownerId)) {
            return true
        }

        // Refresh stories and try again
        try {
            const { fetchStories } = await import('@/services/stories')
            const freshGroups = await fetchStories()
            state.setGroups(freshGroups)
            return get().openStoryById(storyId, ownerId)
        } catch (err) {
            console.error('Failed to refresh stories:', err)
            return false
        }
    },
}))
