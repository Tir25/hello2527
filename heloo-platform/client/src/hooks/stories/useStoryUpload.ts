/**
 * useStoryUpload Hook
 * Handle story creation and upload (image/video only)
 * 
 * @module hooks/stories/useStoryUpload
 */

import { useState, useCallback } from 'react'
import { uploadStoryMedia, createStory } from '@/services/stories'
import type { StoryMediaType, UploadProgress, TextOverlay, Sticker } from '@/types'

interface UploadParams {
    mediaFile: File
    mediaType: StoryMediaType
    caption?: string
    // New overlay parameters (for future DB persistence)
    filter?: string
    textOverlays?: TextOverlay[]
    stickers?: Sticker[]
    scheduledAt?: string | null
    audienceType?: 'public' | 'close_friends'
}

/**
 * Hook to handle story upload with progress
 */
export function useStoryUpload() {
    const [progress, setProgress] = useState<UploadProgress>({
        stage: 'compressing',
        progress: 0,
        message: ''
    })
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const upload = useCallback(async (params: UploadParams) => {
        const { mediaFile, mediaType, caption } = params

        setIsUploading(true)
        setError(null)
        setProgress({ stage: 'compressing', progress: 0, message: 'Preparing media...' })

        let uploadResult: { mediaUrl: string; thumbnailUrl?: string; duration?: number } | null = null

        try {
            // Upload media (compression happens inside uploadStoryMedia)
            uploadResult = await uploadStoryMedia({
                mediaFile,
                mediaType,
                onProgress: (stage, percent) => {
                    setProgress({
                        stage: 'uploading',
                        progress: percent,
                        message: stage
                    })
                }
            })

            // Use duration from upload result, or defaults
            const duration = uploadResult.duration ?? (mediaType === 'image' ? 5 : 15)

            // Create story record in database
            setProgress({ stage: 'processing', progress: 90, message: 'Saving story...' })

            const { data: { user: authUser } } = await (await import('@/lib/supabase')).supabase.auth.getUser()
            if (!authUser) throw new Error('Not authenticated')

            const story = await createStory({
                user_id: authUser.id,
                media_url: uploadResult.mediaUrl,
                media_type: mediaType,
                thumbnail_url: uploadResult.thumbnailUrl || null,
                duration_seconds: duration,
                music_url: null,
                music_title: null,
                caption: caption || null,
                // New feature fields
                filter: params.filter || 'none',
                text_overlays: params.textOverlays || undefined,
                stickers: params.stickers || undefined,
                scheduled_at: params.scheduledAt || undefined,
                audience_type: params.audienceType || 'public',
            })

            setProgress({ stage: 'complete', progress: 100, message: 'Story posted!' })
            return story

        } catch (err) {
            console.error('Upload failed:', err)

            // Cleanup uploaded files if database insert failed
            if (uploadResult?.mediaUrl) {
                try {
                    const { deleteStoryFiles } = await import('@/services/stories')
                    await deleteStoryFiles({ media_url: uploadResult.mediaUrl })
                    console.info('Cleaned up orphaned story files after database failure')
                } catch (cleanupErr) {
                    console.error('Failed to cleanup orphaned files:', cleanupErr)
                }
            }

            const message = err instanceof Error ? err.message : 'Upload failed'
            setError(message)
            setProgress({ stage: 'error', progress: 0, message })
            throw err

        } finally {
            setIsUploading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setProgress({ stage: 'compressing', progress: 0, message: '' })
        setError(null)
        setIsUploading(false)
    }, [])

    return {
        upload,
        reset,
        progress,
        isUploading,
        error,
    }
}
