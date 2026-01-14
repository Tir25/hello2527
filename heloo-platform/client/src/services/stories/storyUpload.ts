/**
 * Story Upload Service
 * Handles file uploads to Supabase Storage (image/video only)
 * 
 * @module services/stories/storyUpload
 */

import { supabase } from '@/lib/supabase'
import { compressImage } from './imageCompressor'
import { compressVideo, needsCompression } from './videoCompressor'
import { getVideoDuration } from './videoUtils'
import type { StoryMediaType } from '@/types'

/** Upload result */
interface UploadResult {
    mediaUrl: string
    thumbnailUrl?: string
    duration?: number
}

/** Upload options */
interface UploadOptions {
    mediaFile: File
    mediaType: StoryMediaType
    onProgress?: (stage: string, percent: number) => void
}

/**
 * Generate unique file path for storage
 */
function generatePath(userId: string, type: string, extension: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${userId}/${type}_${timestamp}_${random}.${extension}`
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToStorage(
    path: string,
    blob: Blob,
    contentType: string
): Promise<string> {
    const { data, error } = await supabase.storage
        .from('stories')
        .upload(path, blob, {
            contentType,
            upsert: false
        })

    if (error) throw error

    const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(data.path)

    return urlData.publicUrl
}

/**
 * Upload story media (image/video) with compression
 */
export async function uploadStoryMedia(options: UploadOptions): Promise<UploadResult> {
    const { mediaFile, mediaType, onProgress } = options

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const result: UploadResult = { mediaUrl: '' }

    try {
        if (mediaType === 'image') {
            onProgress?.('Compressing image...', 20)
            const compressed = await compressImage(mediaFile)

            onProgress?.('Uploading image...', 60)
            const extension = compressed.type === 'image/webp' ? 'webp' : 'jpg'
            const path = generatePath(user.id, 'image', extension)
            result.mediaUrl = await uploadToStorage(path, compressed, compressed.type)

        } else if (mediaType === 'video') {
            // Get video duration first
            let duration = 15
            try {
                duration = await getVideoDuration(mediaFile)
            } catch {
                console.warn('Could not get video duration, using default')
            }

            // Check if compression is needed
            let videoBlob: Blob = mediaFile
            if (needsCompression(mediaFile, duration)) {
                onProgress?.('Compressing video...', 10)
                const compressed = await compressVideo(mediaFile, (percent, message) => {
                    onProgress?.(message, 10 + percent * 0.5)
                })
                videoBlob = compressed.blob
                duration = compressed.duration
            }

            onProgress?.('Uploading video...', 70)
            const contentType = videoBlob.type || 'video/webm'
            const extension = contentType.includes('mp4') ? 'mp4' : 'webm'
            const path = generatePath(user.id, 'video', extension)
            result.mediaUrl = await uploadToStorage(path, videoBlob, contentType)
            result.duration = duration
        }

        onProgress?.('Complete!', 100)
        return result

    } catch (error) {
        if (result.mediaUrl) {
            await deleteStoryFiles({ media_url: result.mediaUrl }).catch(console.error)
        }
        throw error
    }
}

/**
 * Delete story files from storage
 */
export async function deleteStoryFiles(story: {
    media_url: string
}): Promise<void> {
    const extractPath = (url: string) => {
        const match = url.match(/\/stories\/(.+)$/)
        return match ? match[1] : null
    }

    const mediaPath = extractPath(story.media_url)
    if (mediaPath) {
        await supabase.storage.from('stories').remove([mediaPath])
    }
}
