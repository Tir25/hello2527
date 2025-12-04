import { useState, useRef, useCallback } from 'react'
import {
    getSupportedAudioMimeType,
    requestMicrophoneAccess,
    createAudioRecorder,
    createAudioFile,
    stopMediaStream,
    type RecordingError,
} from '@/services/media/audioRecording.service'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { MediaType } from '@/services/media/mediaValidation.service'

/**
 * Audio Recording Hook
 * 
 * Responsibility: Audio recording state machine and lifecycle management
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Mic permission handling
 * - Recording start/stop orchestration
 * - Error handling (NotAllowedError, NotFoundError, NotReadableError)
 * - Blob → File conversion
 * - Cleanup on unmount
 */

export interface UseAudioRecordingReturn {
    isRecording: boolean
    isRequestingMic: boolean
    startRecording: (onComplete: (file: File, type: MediaType) => void) => Promise<void>
    stopRecording: () => void
}

export const useAudioRecording = (): UseAudioRecordingReturn => {
    const [isRecording, setIsRecording] = useState(false)
    const [isRequestingMic, setIsRequestingMic] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const onCompleteCallbackRef = useRef<((file: File, type: MediaType) => void) | null>(null)

    /**
     * Starts audio recording
     * @param onComplete - Callback invoked when recording is stopped with audio File
     */
    const startRecording = useCallback(async (onComplete: (file: File, type: MediaType) => void) => {
        setIsRequestingMic(true)
        onCompleteCallbackRef.current = onComplete

        try {
            // Check MIME type support FIRST before requesting mic
            const supportedMimeType = getSupportedAudioMimeType()
            if (!supportedMimeType) {
                toast.error('Audio recording not supported on your browser')
                setIsRequestingMic(false)
                logger.error('media:recording:no-mime-type', 'No supported audio MIME type found')
                return
            }

            // Request microphone access
            const stream = await requestMicrophoneAccess()
            setIsRequestingMic(false)

            // Create MediaRecorder
            const mediaRecorder = createAudioRecorder(stream, supportedMimeType)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            // Handle data available event
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            // Handle stop event
            mediaRecorder.onstop = () => {
                const audioFile = createAudioFile(audioChunksRef.current, supportedMimeType)

                // Stop and release media stream
                stopMediaStream(stream)

                // Call completion callback
                if (onCompleteCallbackRef.current) {
                    onCompleteCallbackRef.current(audioFile, 'audio')
                    onCompleteCallbackRef.current = null
                }
            }

            // Start recording
            mediaRecorder.start()
            setIsRecording(true)
            logger.info('media:recording:started', `Recording started with ${supportedMimeType}`)
        } catch (error) {
            setIsRequestingMic(false)
            logger.error('useAudioRecording:startRecording', 'Failed to start recording', error)

            // Better error messages based on RecordingError type
            if (error && typeof error === 'object' && 'type' in error) {
                const recordingError = error as RecordingError
                toast.error(recordingError.message)
            } else {
                toast.error('Failed to access microphone.')
            }
        }
    }, [])

    /**
     * Stops current recording
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            logger.info('media:recording:stopped', 'Recording stopped by user')
        }
    }, [isRecording])

    return {
        isRecording,
        isRequestingMic,
        startRecording,
        stopRecording,
    }
}
