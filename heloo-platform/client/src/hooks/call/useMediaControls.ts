/**
 * useMediaControls Hook
 * 
 * Extracted media control actions for local stream.
 * @module hooks/call/useMediaControls
 */

import { useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { LocalStreamRefs } from './localStreamTypes'

interface UseMediaControlsOptions {
    refs: LocalStreamRefs
    isAudioMuted: boolean
    isVideoMuted: boolean
    isScreenSharing: boolean
    setIsAudioMuted: (muted: boolean) => void
    setIsVideoMuted: (muted: boolean) => void
    setIsScreenSharing: (sharing: boolean) => void
    setStream: (stream: MediaStream | null) => void
}

export function useMediaControls({
    refs,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    setIsAudioMuted,
    setIsVideoMuted,
    setIsScreenSharing,
    setStream,
}: UseMediaControlsOptions) {
    /**
     * Toggle audio mute state
     */
    const toggleAudio = useCallback(() => {
        const currentStream = refs.stream.current
        if (!currentStream) return

        const audioTracks = currentStream.getAudioTracks()
        if (audioTracks.length === 0) return

        const newMutedState = !isAudioMuted
        audioTracks.forEach(track => { track.enabled = !newMutedState })

        if (refs.isMounted.current) setIsAudioMuted(newMutedState)
        logger.debug('useMediaControls:toggleAudio', 'Audio toggled', { muted: newMutedState })
    }, [refs, isAudioMuted, setIsAudioMuted])

    /**
     * Toggle video mute state
     */
    const toggleVideo = useCallback(() => {
        const currentStream = refs.stream.current
        if (!currentStream) return

        const videoTracks = currentStream.getVideoTracks()
        if (videoTracks.length === 0) return

        const newMutedState = !isVideoMuted
        videoTracks.forEach(track => { track.enabled = !newMutedState })

        if (refs.isMounted.current) setIsVideoMuted(newMutedState)
        logger.debug('useMediaControls:toggleVideo', 'Video toggled', { muted: newMutedState })
    }, [refs, isVideoMuted, setIsVideoMuted])

    /**
     * Switch camera (toggle between user/environment facing modes)
     */
    const switchCamera = useCallback(async () => {
        const currentStream = refs.stream.current
        if (!currentStream) return

        const videoTrack = currentStream.getVideoTracks()[0]
        if (!videoTrack) return

        const settings = videoTrack.getSettings()
        const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user'

        logger.info('useMediaControls:switchCamera', 'Switching camera', { to: newFacingMode })

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { exact: newFacingMode } },
                audio: false,
            })
            const newVideoTrack = newStream.getVideoTracks()[0]
            videoTrack.stop()
            currentStream.removeTrack(videoTrack)
            currentStream.addTrack(newVideoTrack)
            if (refs.isMounted.current) setStream(new MediaStream(currentStream.getTracks()))
        } catch {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: newFacingMode },
                    audio: false,
                })
                const newVideoTrack = newStream.getVideoTracks()[0]
                videoTrack.stop()
                currentStream.removeTrack(videoTrack)
                currentStream.addTrack(newVideoTrack)
                if (refs.isMounted.current) setStream(new MediaStream(currentStream.getTracks()))
            } catch (retryErr) {
                logger.error('useMediaControls:switchCamera', 'Retry failed', retryErr)
            }
        }
    }, [refs, setStream])

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = useCallback(async () => {
        const currentStream = refs.stream.current
        if (!currentStream) return

        if (isScreenSharing) {
            const screenTrack = currentStream.getVideoTracks()[0]
            if (screenTrack) {
                screenTrack.stop()
                currentStream.removeTrack(screenTrack)
            }
            if (refs.originalVideoTrack.current) {
                currentStream.addTrack(refs.originalVideoTrack.current)
                refs.originalVideoTrack.current = null
            }
            if (refs.isMounted.current) setIsScreenSharing(false)
            logger.info('useMediaControls:toggleScreenShare', 'Screen sharing stopped')
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
                const screenTrack = screenStream.getVideoTracks()[0]
                const currentVideoTrack = currentStream.getVideoTracks()[0]

                if (currentVideoTrack) {
                    refs.originalVideoTrack.current = currentVideoTrack
                    currentStream.removeTrack(currentVideoTrack)
                }
                currentStream.addTrack(screenTrack)

                screenTrack.onended = () => {
                    if (refs.isMounted.current) toggleScreenShare()
                }

                if (refs.isMounted.current) setIsScreenSharing(true)
                logger.info('useMediaControls:toggleScreenShare', 'Screen sharing started')
            } catch (err) {
                logger.warn('useMediaControls:toggleScreenShare', 'Screen sharing cancelled', err)
            }
        }
    }, [refs, isScreenSharing, setIsScreenSharing])

    /**
     * Stop all tracks and cleanup
     */
    const stopStream = useCallback(() => {
        const currentStream = refs.stream.current
        if (currentStream) {
            logger.debug('useMediaControls:stopStream', 'Stopping media tracks')
            currentStream.getTracks().forEach(track => track.stop())
            refs.stream.current = null
        }

        if (refs.originalVideoTrack.current) {
            refs.originalVideoTrack.current.stop()
            refs.originalVideoTrack.current = null
        }

        if (refs.isMounted.current) {
            setStream(null)
            setIsAudioMuted(false)
            setIsVideoMuted(false)
            setIsScreenSharing(false)
        }
    }, [refs, setStream, setIsAudioMuted, setIsVideoMuted, setIsScreenSharing])

    return { toggleAudio, toggleVideo, switchCamera, toggleScreenShare, stopStream }
}
