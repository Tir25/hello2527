/**
 * useStoryPreload Hook
 * Preloads adjacent story media for smooth transitions
 * 
 * @module hooks/stories/useStoryPreload
 */

import { useEffect, useRef } from 'react'
import type { StoryGroup } from '@/types'

interface UseStoryPreloadProps {
    isOpen: boolean
    currentGroup: StoryGroup | null
    currentStoryIndex: number
    groups: StoryGroup[]
    currentGroupIndex: number
}

/**
 * Preloads next story media for seamless transitions
 */
export function useStoryPreload({
    isOpen,
    currentGroup,
    currentStoryIndex,
    groups,
    currentGroupIndex
}: UseStoryPreloadProps): void {
    const preloadedRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!isOpen || !currentGroup) return

        const preloadMedia = (url: string, type: 'image' | 'video') => {
            if (preloadedRef.current.has(url)) return

            preloadedRef.current.add(url)

            if (type === 'image') {
                const img = new Image()
                img.src = url
            } else {
                // For video, just prefetch the URL
                const link = document.createElement('link')
                link.rel = 'prefetch'
                link.as = 'video'
                link.href = url
                document.head.appendChild(link)
            }
        }

        // Preload next story in current group
        const nextStoryInGroup = currentGroup.stories[currentStoryIndex + 1]
        if (nextStoryInGroup) {
            preloadMedia(nextStoryInGroup.media_url, nextStoryInGroup.media_type)
        }

        // Preload first story of next group
        const nextGroup = groups[currentGroupIndex + 1]
        if (nextGroup?.stories[0]) {
            preloadMedia(nextGroup.stories[0].media_url, nextGroup.stories[0].media_type)
        }
    }, [isOpen, currentGroup, currentStoryIndex, groups, currentGroupIndex])

    // Clear cache when viewer closes
    useEffect(() => {
        if (!isOpen) {
            preloadedRef.current.clear()
        }
    }, [isOpen])
}
