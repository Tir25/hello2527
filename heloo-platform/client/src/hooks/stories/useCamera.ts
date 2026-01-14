/**
 * useCamera Hook
 * Handles camera stream initialization and management
 * 
 * @module hooks/stories/useCamera
 */

import { useState, useEffect, useRef, useCallback, RefObject } from 'react'

interface UseCameraProps {
    videoRef: RefObject<HTMLVideoElement | null>
    initialFacingMode?: 'user' | 'environment'
}

interface UseCameraReturn {
    isCameraReady: boolean
    facingMode: 'user' | 'environment'
    cameraError: string | null
    flipCamera: () => void
    canvasRef: RefObject<HTMLCanvasElement | null>
}

/**
 * Manages camera stream lifecycle and controls
 */
export function useCamera({
    videoRef,
    initialFacingMode = 'user'
}: UseCameraProps): UseCameraReturn {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mountedRef = useRef(true)

    const [isCameraReady, setIsCameraReady] = useState(false)
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode)
    const [cameraError, setCameraError] = useState<string | null>(null)

    // Start camera on mount and when facingMode changes
    useEffect(() => {
        mountedRef.current = true
        setCameraError(null)

        const startCamera = async () => {
            try {
                // Stop existing stream first
                if (videoRef.current?.srcObject) {
                    const oldStream = videoRef.current.srcObject as MediaStream
                    oldStream.getTracks().forEach(track => track.stop())
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode, aspectRatio: 9 / 16 },
                    audio: true
                })

                if (videoRef.current && mountedRef.current) {
                    videoRef.current.srcObject = stream
                    setIsCameraReady(true)
                    setCameraError(null)
                }
            } catch (err) {
                console.error('Camera access denied:', err)
                if (mountedRef.current) {
                    const errorName = err instanceof Error ? err.name : ''
                    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
                        setCameraError('Camera access denied. Please allow camera permissions.')
                    } else if (errorName === 'NotFoundError') {
                        setCameraError('No camera found. Please connect a camera.')
                    } else {
                        setCameraError('Could not access camera. Please check settings.')
                    }
                }
            }
        }

        startCamera()

        return () => {
            mountedRef.current = false
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [facingMode, videoRef])

    const flipCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    }, [])

    return { isCameraReady, facingMode, cameraError, flipCamera, canvasRef }
}
