/**
 * Camera Capture Component
 * Handles camera access, photo capture, and video recording
 * 
 * @module components/stories/CameraCapture
 */

import { memo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, RotateCcw, Image as ImageIcon } from 'lucide-react'
import { useCamera, useMediaRecorder } from '@/hooks/stories'

interface CameraCaptureProps {
    onClose: () => void
    onCapture: (blob: Blob, type: 'image' | 'video', previewUrl: string) => void
    onGalleryUpload: (file: File) => void
}

const MAX_RECORD_TIME = 30

/**
 * Camera interface with capture button
 */
export const CameraCapture = memo(function CameraCapture({
    onClose,
    onCapture,
    onGalleryUpload
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
    const startTimeRef = useRef<number>(0)
    const isRecordingRef = useRef(false)

    // Use custom hooks for camera and recording
    const { isCameraReady, facingMode, cameraError, flipCamera, canvasRef } = useCamera({ videoRef })
    const { isRecording, recordingTime, takePhoto, startRecording, stopRecording } = useMediaRecorder({
        videoRef, canvasRef, facingMode, onCapture
    })

    // Sync ref for closure access
    isRecordingRef.current = isRecording

    // Capture button: tap for photo, hold for video
    const handlePointerDown = useCallback(() => {
        if (!isCameraReady) return
        startTimeRef.current = Date.now()
        pressTimerRef.current = setTimeout(startRecording, 200)
    }, [isCameraReady, startRecording])

    const handlePointerUp = useCallback(() => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current)
            pressTimerRef.current = null
        }
        const duration = Date.now() - startTimeRef.current
        if (duration < 200 && !isRecordingRef.current) {
            takePhoto()
        } else if (isRecordingRef.current) {
            stopRecording()
        }
    }, [takePhoto, stopRecording])

    const handlePointerLeave = useCallback(() => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current)
            pressTimerRef.current = null
        }
        if (isRecordingRef.current) stopRecording()
    }, [stopRecording])

    const handleGalleryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) onGalleryUpload(file)
    }, [onGalleryUpload])

    return (
        <div className="relative w-full h-full flex flex-col bg-black">
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder */}
            <div className="flex-1 relative overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay playsInline muted
                    className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                />

                {/* Camera Error */}
                {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
                        <div className="text-center px-6 max-w-xs">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <X className="w-8 h-8 text-red-400" />
                            </div>
                            <p className="text-white text-sm leading-relaxed">{cameraError}</p>
                            <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="absolute left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/50 to-transparent"
                    style={{ top: 'env(safe-area-inset-top, 0)' }}>
                    <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
                        <X className="w-6 h-6" />
                    </button>
                    {isRecording && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/80 rounded-full animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            <span className="text-white text-xs font-mono font-bold">{recordingTime.toFixed(1)}s</span>
                        </div>
                    )}
                    <div className="w-10" />
                </div>
            </div>

            {/* Controls */}
            <div className="h-32 bg-black flex items-center justify-around px-8"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                {/* Gallery */}
                <label className="cursor-pointer group flex flex-col items-center gap-1 touch-manipulation">
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleGalleryChange} />
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium">Gallery</span>
                </label>

                {/* Capture Button */}
                <div className="relative">
                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 -rotate-90 pointer-events-none">
                        <circle cx="48" cy="48" r="46" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                        {isRecording && (
                            <motion.circle cx="48" cy="48" r="46" stroke="#ef4444" strokeWidth="4" fill="none"
                                strokeDasharray="289" strokeDashoffset={289 - (289 * recordingTime / MAX_RECORD_TIME)} />
                        )}
                    </svg>
                    <button
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerLeave}
                        onPointerCancel={handlePointerLeave}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`relative w-16 h-16 rounded-full border-4 border-white transition-all duration-200 touch-manipulation select-none
                            ${isRecording ? 'bg-red-500 scale-90' : 'bg-white/20 hover:bg-white/40 active:bg-white/60'}
                            shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
                        aria-label={isRecording ? 'Stop recording' : 'Tap for photo, hold for video'}
                    />
                </div>

                {/* Flip Camera */}
                <button
                    onClick={flipCamera}
                    disabled={isRecording}
                    className={`flex flex-col items-center gap-1 touch-manipulation ${isRecording ? 'opacity-30' : 'active:scale-95 transition-transform'}`}
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Flip</span>
                </button>
            </div>
        </div>
    )
})
