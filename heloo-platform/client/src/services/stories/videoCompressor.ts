/**
 * Video Compressor
 * Client-side video optimization for stories
 * Uses a simpler approach that works across browsers including iOS Safari
 * 
 * @module services/stories/videoCompressor
 */

/** Target max file size: 10MB */
const TARGET_MAX_SIZE = 10 * 1024 * 1024

/** Max video duration in seconds */
const MAX_DURATION = 30

/**
 * Video compression result
 */
interface CompressionResult {
    blob: Blob
    duration: number
    wasCompressed: boolean
}

/**
 * Check if video needs compression (size > 10MB or duration > 30s)
 */
export function needsCompression(file: File, duration: number): boolean {
    return file.size > TARGET_MAX_SIZE || duration > MAX_DURATION
}

/**
 * Compress video by trimming to max duration
 * For files that are too large, we upload as-is and let the server handle it
 * This is a pragmatic approach that works across all browsers
 */
export async function compressVideo(
    file: File,
    onProgress?: (percent: number, message: string) => void
): Promise<CompressionResult> {
    onProgress?.(10, 'Analyzing video...')

    // Load video to get metadata
    const { video, url } = await loadVideo(file)
    const originalDuration = video.duration

    // Clean up video element
    video.pause()
    video.src = ''
    video.load()
    URL.revokeObjectURL(url)

    // If video is already within limits, return as-is
    if (file.size <= TARGET_MAX_SIZE && originalDuration <= MAX_DURATION) {
        onProgress?.(100, 'Video ready!')
        return {
            blob: file,
            duration: Math.round(originalDuration),
            wasCompressed: false
        }
    }

    onProgress?.(30, 'Processing video...')

    // For duration trimming, we need to re-encode
    // Check if MediaRecorder is available for re-encoding
    if (originalDuration > MAX_DURATION && supportsReEncoding()) {
        try {
            const trimmed = await trimVideo(file, MAX_DURATION, onProgress)
            return trimmed
        } catch (err) {
            console.warn('Video trimming failed, uploading original:', err)
        }
    }

    // If we can't compress, return original with clamped duration
    onProgress?.(100, 'Video ready!')
    return {
        blob: file,
        duration: Math.min(Math.round(originalDuration), MAX_DURATION),
        wasCompressed: false
    }
}

/**
 * Check if browser supports video re-encoding
 */
function supportsReEncoding(): boolean {
    if (typeof MediaRecorder === 'undefined') return false

    // Check for any supported video MIME type
    const types = ['video/webm', 'video/mp4']
    return types.some(type => MediaRecorder.isTypeSupported(type))
}

/**
 * Trim video to specified duration using MediaRecorder
 */
async function trimVideo(
    file: File,
    maxDuration: number,
    onProgress?: (percent: number, message: string) => void
): Promise<CompressionResult> {
    const { video, url } = await loadVideo(file)

    try {
        // Get supported MIME type
        const mimeType = getSupportedMimeType()

        // Create canvas for frame capture
        const canvas = document.createElement('canvas')
        canvas.width = Math.min(video.videoWidth, 1280)
        canvas.height = Math.min(video.videoHeight, 720)
        const ctx = canvas.getContext('2d')!

        // Create stream from canvas
        const stream = canvas.captureStream(24)

        // Set up recorder
        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 1500000 // 1.5 Mbps
        })

        const chunks: Blob[] = []
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data)
        }

        // Start recording and playback
        recorder.start(100) // Collect data every 100ms
        video.currentTime = 0
        video.muted = true

        await video.play()

        return new Promise((resolve, reject) => {
            const frameLoop = () => {
                if (video.currentTime >= maxDuration || video.ended) {
                    video.pause()
                    recorder.stop()
                    return
                }

                // Draw frame
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                // Progress update
                const progress = 30 + (video.currentTime / maxDuration) * 60
                onProgress?.(progress, `Trimming: ${Math.round(video.currentTime)}s / ${maxDuration}s`)

                requestAnimationFrame(frameLoop)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType })
                onProgress?.(100, 'Compression complete!')

                console.info(`Video trimmed: ${originalSizeMB(file)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`)

                // Cleanup
                video.pause()
                video.src = ''
                URL.revokeObjectURL(url)

                resolve({
                    blob,
                    duration: maxDuration,
                    wasCompressed: true
                })
            }

            recorder.onerror = () => {
                // Cleanup on error
                video.pause()
                video.src = ''
                URL.revokeObjectURL(url)
                reject(new Error('Video compression failed'))
            }

            requestAnimationFrame(frameLoop)
        })
    } catch (err) {
        // Cleanup on error
        video.pause()
        video.src = ''
        URL.revokeObjectURL(url)
        throw err
    }
}

/**
 * Load video and get metadata
 */
function loadVideo(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        const url = URL.createObjectURL(file)

        video.onloadedmetadata = () => {
            resolve({ video, url })
        }

        video.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load video'))
        }

        video.preload = 'metadata'
        video.playsInline = true
        video.src = url
        video.load()
    })
}

/**
 * Get best supported MIME type
 */
function getSupportedMimeType(): string {
    const types = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
    ]
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'
}

/**
 * Helper to get file size in MB
 */
function originalSizeMB(file: File): string {
    return (file.size / 1024 / 1024).toFixed(2)
}
