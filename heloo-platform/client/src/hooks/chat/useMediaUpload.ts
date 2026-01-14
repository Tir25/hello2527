import { useState, useCallback, useEffect } from 'react'
import { chatService } from '@/lib/services/chat.service'
import { validateFile, validateAndCompressImage, type MediaType } from '@/services/media/mediaValidation.service'
import { getUserFriendlyError } from '@/lib/constants/storage'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

/**
 * Media Upload Hook
 * 
 * Responsibility: File upload orchestration and state management
 * Layer: Hook (Logic)
 * 
 * Features:
 * - File validation (type, size)
 * - Image compression
 * - Preview URL generation
 * - Upload to Supabase via chatService
 * - Error handling and retry logic
 */

export interface FilePreview {
    file: File
    preview: string
    type: MediaType
    error?: string
}

export interface UseMediaUploadReturn {
    filePreview: FilePreview | null
    isUploading: boolean
    uploadError: string | null
    handleFileSelect: (file: File, type: MediaType) => Promise<void>
    handleUploadAndSend: (
        file: File,
        fileType: MediaType,
        onSuccess: (mediaUrl: string, mediaType: MediaType) => void
    ) => Promise<void>
    removePreview: () => void
    retryUpload: (onSuccess: (mediaUrl: string, mediaType: MediaType) => void) => Promise<void>
}

export const useMediaUpload = (): UseMediaUploadReturn => {
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    /**
     * Handles file selection with validation and compression
     */
    const handleFileSelect = useCallback(async (file: File, type: MediaType) => {
        let fileToPreview = file
        let preview = ''

        // For images: validate and compress
        if (type === 'image') {
            const result = await validateAndCompressImage(file)
            if (!result.isValid) {
                return
            }
            fileToPreview = result.file!
        } else {
            // For other types: just validate
            const validation = validateFile(file, type)
            if (!validation.isValid) {
                return
            }
        }

        // Create preview URL for images and videos
        if (type === 'image' || type === 'video') {
            preview = URL.createObjectURL(fileToPreview)
        }

        setFilePreview({ file: fileToPreview, preview, type })
        setUploadError(null)
    }, [])

    /**
     * Uploads file to Supabase and calls onSuccess callback with media URL
     */
    const handleUploadAndSend = useCallback(
        async (
            file: File,
            fileType: MediaType,
            onSuccess: (mediaUrl: string, mediaType: MediaType) => void
        ) => {
            setIsUploading(true)
            setUploadError(null)

            try {
                logger.info('media:upload:started', `Uploading ${fileType} - ${file.size} bytes`)

                // Upload to Supabase
                const uploadResult = await chatService.uploadMedia(file, fileType)

                if (!uploadResult.success || !uploadResult.data) {
                    const errorMessage = getUserFriendlyError(uploadResult.error)
                    logger.error('media:upload:failed', `Failed to upload ${fileType}: ${uploadResult.error || 'Unknown error'}`)
                    toast.error(errorMessage)
                    setUploadError(errorMessage)
                    return
                }

                logger.info(
                    'media:upload:success',
                    `Uploaded ${fileType} - Size: ${file.size} - URL: ${uploadResult.data.publicUrl}`
                )

                // Call success callback with media URL
                const mediaType = fileType === 'image' ? 'image' : fileType === 'video' ? 'video' : fileType === 'audio' ? 'audio' : 'document'
                onSuccess(uploadResult.data.publicUrl, mediaType)

                // Reset state
                setFilePreview(null)
                setUploadError(null)
            } catch (error) {
                logger.error('useMediaUpload:handleUploadAndSend', 'Failed to upload and send media', error)
                const errorMessage = getUserFriendlyError(error instanceof Error ? error.message : String(error))
                toast.error(errorMessage)
                setUploadError(errorMessage)
            } finally {
                setIsUploading(false)
            }
        },
        []
    )

    /**
     * Removes file preview and revokes object URL
     */
    const removePreview = useCallback(() => {
        if (filePreview?.preview) {
            URL.revokeObjectURL(filePreview.preview)
        }
        setFilePreview(null)
        setUploadError(null)
    }, [filePreview])

    /**
     * Retries upload with existing file preview
     */
    const retryUpload = useCallback(
        async (onSuccess: (mediaUrl: string, mediaType: MediaType) => void) => {
            if (filePreview && !isUploading) {
                await handleUploadAndSend(filePreview.file, filePreview.type, onSuccess)
            }
        },
        [filePreview, isUploading, handleUploadAndSend]
    )

    // Cleanup object URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (filePreview?.preview) {
                URL.revokeObjectURL(filePreview.preview)
            }
        }
    }, [filePreview])

    return {
        filePreview,
        isUploading,
        uploadError,
        handleFileSelect,
        handleUploadAndSend,
        removePreview,
        retryUpload,
    }
}
