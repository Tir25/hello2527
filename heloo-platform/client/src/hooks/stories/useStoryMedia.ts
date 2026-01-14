/**
 * useStoryMedia Hook
 * Handles media playback state for story viewer
 * 
 * @module hooks/stories/useStoryMedia
 */

import { useState, useEffect, useRef, useCallback, RefObject } from 'react'
import { Story } from '@/types'

interface UseStoryMediaProps {
    isOpen: boolean
    isPaused: boolean
    currentStory: Story | null
}

interface UseStoryMediaReturn {
    mediaReady: boolean
    videoRef: RefObject<HTMLVideoElement | null>
    handleMediaLoaded: () => void
}

/**
 * Manages video/image loading and playback state
 */
export function useStoryMedia({
    isOpen,
    isPaused,
    currentStory
}: UseStoryMediaProps): UseStoryMediaReturn {
    const [mediaReady, setMediaReady] = useState(false)
    const hasPlayedRef = useRef(false)
    const currentStoryIdRef = useRef<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Reset state when story changes or viewer closes
    useEffect(() => {
        if (!isOpen || !currentStory) {
            videoRef.current?.pause()
            setMediaReady(false)
            hasPlayedRef.current = false
            currentStoryIdRef.current = null
            return
        }

        // Check if this is a NEW story
        if (currentStoryIdRef.current !== currentStory.id) {
            currentStoryIdRef.current = currentStory.id
            setMediaReady(false)
            hasPlayedRef.current = false

            if (videoRef.current) {
                videoRef.current.currentTime = 0
            }
        }
    }, [currentStory?.id, isOpen])

    // Playback controller
    useEffect(() => {
        if (!isOpen || !currentStory?.id || !mediaReady) return

        if (isPaused) {
            videoRef.current?.pause()
        } else if (!hasPlayedRef.current) {
            hasPlayedRef.current = true
            videoRef.current?.play().catch(() => { })
        } else {
            videoRef.current?.play().catch(() => { })
        }
    }, [isOpen, currentStory?.id, mediaReady, isPaused])

    const handleMediaLoaded = useCallback(() => {
        setMediaReady(true)
    }, [])

    return { mediaReady, videoRef, handleMediaLoaded }
}
