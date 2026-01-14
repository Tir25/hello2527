/**
 * useMediaRecorder Hook
 * Handles photo capture and video recording
 * 
 * @module hooks/stories/useMediaRecorder
 */

import { useState, useRef, useCallback, useEffect, RefObject } from 'react'

const MAX_RECORD_TIME = 30

interface UseMediaRecorderProps {
    videoRef: RefObject<HTMLVideoElement | null>
    canvasRef: RefObject<HTMLCanvasElement | null>
    facingMode: 'user' | 'environment'
    onCapture: (blob: Blob, type: 'image' | 'video', previewUrl: string) => void
}

interface UseMediaRecorderReturn {
    isRecording: boolean
    recordingTime: number
    takePhoto: () => void
    startRecording: () => void
    stopRecording: () => void
}

/**
 * Manages photo capture and video recording
 */
export function useMediaRecorder({
    videoRef,
    canvasRef,
    facingMode,
    onCapture
}: UseMediaRecorderProps): UseMediaRecorderReturn {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const recordIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const mountedRef = useRef(true)

    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current)
        }
    }, [])

    const clearRecordingTimer = useCallback(() => {
        if (recordIntervalRef.current) {
            clearInterval(recordIntervalRef.current)
            recordIntervalRef.current = null
        }
    }, [])

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (ctx) {
            if (facingMode === 'user') {
                ctx.translate(canvas.width, 0)
                ctx.scale(-1, 1)
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }

        canvas.toBlob(blob => {
            if (blob) {
                const url = URL.createObjectURL(blob)
                onCapture(blob, 'image', url)
            }
        }, 'image/jpeg', 0.9)
    }, [videoRef, canvasRef, facingMode, onCapture])

    const stopRecording = useCallback(() => {
        clearRecordingTimer()
        const recorder = mediaRecorderRef.current
        if (recorder && recorder.state === 'recording') {
            recorder.stop()
        }
        mediaRecorderRef.current = null
    }, [clearRecordingTimer])

    const startRecording = useCallback(() => {
        if (!videoRef.current?.srcObject) return

        const stream = videoRef.current.srcObject as MediaStream
        if (!stream.active) return

        chunksRef.current = []

        const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
        const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''

        try {
            const options = mimeType ? { mimeType } : undefined
            const recorder = new MediaRecorder(stream, options)
            const actualMimeType = recorder.mimeType || 'video/webm'

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                clearRecordingTimer()
                if (chunksRef.current.length > 0) {
                    const blob = new Blob(chunksRef.current, { type: actualMimeType })
                    const url = URL.createObjectURL(blob)
                    onCapture(blob, 'video', url)
                }
                if (mountedRef.current) {
                    setIsRecording(false)
                    setRecordingTime(0)
                }
            }

            recorder.onerror = () => {
                clearRecordingTimer()
                if (mountedRef.current) {
                    setIsRecording(false)
                    setRecordingTime(0)
                }
            }

            recorder.start(100)
            mediaRecorderRef.current = recorder
            setIsRecording(true)
            setRecordingTime(0)

            recordIntervalRef.current = setInterval(() => {
                if (!mountedRef.current) {
                    clearRecordingTimer()
                    return
                }
                setRecordingTime(prev => {
                    const newTime = prev + 0.1
                    if (newTime >= MAX_RECORD_TIME) {
                        if (mediaRecorderRef.current?.state === 'recording') {
                            mediaRecorderRef.current.stop()
                        }
                        clearRecordingTimer()
                        return MAX_RECORD_TIME
                    }
                    return newTime
                })
            }, 100)
        } catch (err) {
            console.error('Failed to start MediaRecorder:', err)
            setIsRecording(false)
        }
    }, [videoRef, onCapture, clearRecordingTimer])

    return { isRecording, recordingTime, takePhoto, startRecording, stopRecording }
}
