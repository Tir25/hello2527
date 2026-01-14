/**
 * useFileValidation Hook
 * 
 * Responsibility: File validation and image compression
 * Layer: Custom Hook
 * 
 * Extracted from MessageInput to improve modularity.
 * Handles:
 * - MIME type validation
 * - File size validation
 * - Image compression with browser-image-compression
 */

import { useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import { STORAGE, getUserFriendlyError } from '@/lib/constants/storage'

export type MediaType = 'image' | 'video' | 'document' | 'audio'

interface CompressionOptions {
    maxSizeMB?: number
    maxWidthOrHeight?: number
    useWebWorker?: boolean
}

const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
}

interface UseFileValidationReturn {
    validateMimeType: (file: File, type: MediaType) => boolean
    validateFileSize: (file: File, type: MediaType) => boolean
    validateFile: (file: File, type: MediaType) => boolean
    compressImage: (file: File, options?: CompressionOptions) => Promise<File>
    getFileSizeLimit: (type: MediaType) => number
    getUserFriendlyError: (error: string) => string
}

/**
 * Hook for file validation and image compression
 */
export const useFileValidation = (): UseFileValidationReturn => {
    /**
     * Validate file MIME type against allowed types
     */
    const validateMimeType = useCallback((file: File, type: MediaType): boolean => {
        const validTypes = STORAGE.VALID_MIME_TYPES[type as keyof typeof STORAGE.VALID_MIME_TYPES] as readonly string[]

        if (!validTypes || !validTypes.includes(file.type)) {
            toast.error(`Invalid ${type} file type. Allowed: ${validTypes?.join(', ') || 'none'}`)
            logger.warn('useFileValidation:validateMimeType', `Invalid MIME type: ${file.type} for ${type}`)
            return false
        }

        return true
    }, [])

    /**
     * Validate file size against limits
     */
    const validateFileSize = useCallback((file: File, type: MediaType): boolean => {
        const sizeLimit = STORAGE.SIZE_LIMITS[type]

        if (file.size > sizeLimit) {
            const sizeMB = (sizeLimit / 1024 / 1024).toFixed(0)
            toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} too large. Maximum: ${sizeMB}MB`)
            logger.warn('useFileValidation:validateFileSize', `File too large: ${file.size} bytes, limit: ${sizeLimit}`)
            return false
        }

        return true
    }, [])

    /**
     * Validate both MIME type and size
     */
    const validateFile = useCallback((file: File, type: MediaType): boolean => {
        return validateMimeType(file, type) && validateFileSize(file, type)
    }, [validateMimeType, validateFileSize])

    /**
     * Compress image using browser-image-compression
     * Returns original file if compression fails
     */
    const compressImage = useCallback(async (
        file: File,
        options: CompressionOptions = DEFAULT_COMPRESSION_OPTIONS
    ): Promise<File> => {
        try {
            logger.info('useFileValidation:compressImage', `Compressing ${file.type} - Size: ${file.size} bytes`)

            const compressionOptions = {
                maxSizeMB: options.maxSizeMB ?? DEFAULT_COMPRESSION_OPTIONS.maxSizeMB,
                maxWidthOrHeight: options.maxWidthOrHeight ?? DEFAULT_COMPRESSION_OPTIONS.maxWidthOrHeight,
                useWebWorker: options.useWebWorker ?? DEFAULT_COMPRESSION_OPTIONS.useWebWorker,
            }

            const compressedFile = await imageCompression(file, compressionOptions)

            const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
            logger.info(
                'useFileValidation:compressImage',
                `Compressed from ${file.size} to ${compressedFile.size} bytes (${compressionRatio}% reduction)`
            )

            return compressedFile
        } catch (error) {
            logger.error('useFileValidation:compressImage', 'Image compression failed', error)
            // Return original file on failure
            return file
        }
    }, [])

    /**
     * Get size limit for a media type
     */
    const getFileSizeLimit = useCallback((type: MediaType): number => {
        return STORAGE.SIZE_LIMITS[type]
    }, [])

    return {
        validateMimeType,
        validateFileSize,
        validateFile,
        compressImage,
        getFileSizeLimit,
        getUserFriendlyError,
    }
}
