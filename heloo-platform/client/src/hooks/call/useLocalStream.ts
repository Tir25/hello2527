/**
 * useLocalStream Hook
 * 
 * Handles local media stream management including getUserMedia,
 * muting audio/video, and switching cameras.
 * 
 * @module hooks/call/useLocalStream
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import type { UseLocalStreamOptions, UseLocalStreamReturn, LocalStreamRefs } from './localStreamTypes'
import { useMediaControls } from './useMediaControls'

// Re-export types for convenience
export type { UseLocalStreamOptions, UseLocalStreamReturn } from './localStreamTypes'

/**
 * Hook for managing local media stream
 */
export function useLocalStream(options: UseLocalStreamOptions = {}): UseLocalStreamReturn {
    const { audio = true, video = true } = options

    // State
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isAudioMuted, setIsAudioMuted] = useState(false)
    const [isVideoMuted, setIsVideoMuted] = useState(false)
    const [isScreenSharing, setIsScreenSharing] = useState(false)

    // Refs
    const refs: LocalStreamRefs = {
        stream: useRef<MediaStream | null>(null),
        originalVideoTrack: useRef<MediaStreamTrack | null>(null),
        isMounted: useRef(true),
    }

    // Track mounted state
    useEffect(() => {
        refs.isMounted.current = true
        return () => { refs.isMounted.current = false }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (refs.stream.current) {
                refs.stream.current.getTracks().forEach(track => track.stop())
                refs.stream.current = null
            }
        }
    }, [])

    // Media controls from extracted hook
    const controls = useMediaControls({
        refs,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        setIsAudioMuted,
        setIsVideoMuted,
        setIsScreenSharing,
        setStream,
    })

    /**
     * Initialize the local media stream
     */
    const initializeStream = useCallback(async (
        requestOptions?: { video?: boolean; audio?: boolean }
    ): Promise<MediaStream> => {
        // Return existing stream if available
        if (refs.stream.current) return refs.stream.current

        const requestAudio = requestOptions?.audio ?? audio
        const requestVideo = requestOptions?.video ?? video

        logger.debug('useLocalStream:initializeStream', 'Requesting media access', {
            audio: requestAudio,
            video: requestVideo,
        })

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: requestAudio,
                video: requestVideo ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                } : false,
            })

            refs.stream.current = mediaStream

            if (refs.isMounted.current) {
                setStream(mediaStream)
                setError(null)
                logger.info('useLocalStream:initializeStream', 'Got local stream', {
                    audio: mediaStream.getAudioTracks().length,
                    video: mediaStream.getVideoTracks().length,
                })
            }

            return mediaStream
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get media'
            logger.error('useLocalStream:initializeStream', 'Failed to get local stream', err)
            if (refs.isMounted.current) setError(message)
            throw err
        }
    }, [audio, video])

    /**
     * Get the current stream reference
     */
    const getStream = useCallback(() => refs.stream.current, [])

    return {
        stream,
        error,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        initializeStream,
        getStream,
        ...controls,
    }
}

export default useLocalStream
