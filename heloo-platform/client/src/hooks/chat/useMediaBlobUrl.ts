/**
 * useMediaBlobUrl Hook
 * 
 * Manages blob URL creation for video and audio files with proper MIME types.
 * Includes retry logic with exponential backoff for network failures.
 * 
 * Extracted from MessageContent for better separation of concerns.
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { logger } from '@/lib/logger'

interface UseMediaBlobUrlOptions {
    mediaUrl: string | null | undefined
    mediaType: string | null | undefined
    maxRetries?: number
}

interface UseMediaBlobUrlResult {
    effectiveUrl: string | null
    isCreatingBlob: boolean
}

/**
 * Get MIME type from URL extension
 */
const getMimeTypeFromUrl = (url: string, mediaType: string): string => {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
    const mimeMap: Record<string, string> = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        mov: 'video/quicktime',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
    }

    if (ext && mimeMap[ext]) {
        return mimeMap[ext]
    }

    if (mediaType === 'video') return 'video/mp4'
    if (mediaType === 'audio') return 'audio/mpeg'
    return ''
}

export const useMediaBlobUrl = ({
    mediaUrl,
    mediaType,
    maxRetries = 3,
}: UseMediaBlobUrlOptions): UseMediaBlobUrlResult => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [isCreatingBlob, setIsCreatingBlob] = useState(false)
    const blobUrlRef = useRef<string | null>(null)

    useEffect(() => {
        // Only create blob URLs for video and audio
        if (!mediaUrl || !mediaType || (mediaType !== 'video' && mediaType !== 'audio')) {
            return
        }

        // Skip if we already have a blob URL
        if (blobUrlRef.current) return

        const createBlobUrl = async (attempt: number = 0): Promise<void> => {
            setIsCreatingBlob(true)

            try {
                const mimeType = getMimeTypeFromUrl(mediaUrl, mediaType)
                if (!mimeType) {
                    logger.warn('useMediaBlobUrl', 'Could not determine MIME type', { mediaUrl })
                    setIsCreatingBlob(false)
                    return
                }

                // Fetch with proper CORS mode and cache control
                const response = await fetch(mediaUrl, {
                    mode: 'cors',
                    cache: 'default',  // Allow browser caching to prevent redundant downloads
                    credentials: 'omit',
                })

                if (!response.ok) {
                    logger.debug('useMediaBlobUrl', 'Fetch failed, using direct URL', { status: response.status })
                    setIsCreatingBlob(false)
                    return
                }

                const blob = await response.blob()
                const blobWithType = new Blob([blob], { type: mimeType })
                const url = URL.createObjectURL(blobWithType)
                blobUrlRef.current = url
                setBlobUrl(url)
            } catch (error) {
                // Retry with exponential backoff for network errors
                if (attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 500 // 500ms, 1s, 2s
                    logger.debug('useMediaBlobUrl', `Retry ${attempt + 1}/${maxRetries} in ${delay}ms`)
                    setTimeout(() => createBlobUrl(attempt + 1), delay)
                    return
                }

                // Final failure - direct URL will be used as fallback
                logger.debug('useMediaBlobUrl', 'Using direct URL fallback', {
                    error: error instanceof Error ? error.message : 'Network error'
                })
            } finally {
                setIsCreatingBlob(false)
            }
        }

        createBlobUrl()

        // Cleanup on unmount
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current)
                blobUrlRef.current = null
                setBlobUrl(null)
            }
        }
    }, [mediaUrl, mediaType, maxRetries])

    // Return blob URL if available, otherwise fall back to original URL
    const effectiveUrl = useMemo(() => {
        if ((mediaType === 'video' || mediaType === 'audio') && blobUrl) {
            return blobUrl
        }
        return mediaUrl || null
    }, [mediaUrl, mediaType, blobUrl])

    return {
        effectiveUrl,
        isCreatingBlob,
    }
}
