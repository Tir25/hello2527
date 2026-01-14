/**
 * Video Utilities
 * Helper functions for video processing
 * 
 * @module services/stories/videoUtils
 */

/**
 * Get video duration from a File object
 * @param file - Video file
 * @returns Duration in seconds
 */
export async function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        const objectUrl = URL.createObjectURL(file)

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl)
            const duration = Math.round(video.duration)
            resolve(duration > 0 ? duration : 15) // Fallback to 15s if invalid
        }

        video.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Failed to load video'))
        }

        video.preload = 'metadata'
        video.src = objectUrl
    })
}

/**
 * Default durations for different media types
 */
export const DEFAULT_DURATIONS = {
    image: 5,
    video: 15,
} as const
