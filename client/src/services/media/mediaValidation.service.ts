import imageCompression from 'browser-image-compression'
import { STORAGE } from '@/lib/constants/storage'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

/**
 * Media Validation Service
 * 
 * Responsibility: Pure data validation logic for media files
 * Layer: Service (Data)
 * 
 * Functions:
 * - validateMimeType: Check if file type is allowed
 * - validateFileSize: Check if file size is within limits
 * - compressImage: Compress images before upload
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document'

export interface ValidationResult {
    isValid: boolean
    error?: string
}

/**
 * Validates file MIME type against allowed types
 */
export const validateMimeType = (file: File, type: MediaType): ValidationResult => {
    const validTypes = STORAGE.VALID_MIME_TYPES[type] as readonly string[]

    if (!validTypes.includes(file.type)) {
        const errorMsg = `Invalid ${type} file type. Allowed: ${validTypes.join(', ')}`
        toast.error(errorMsg)
        return {
            isValid: false,
            error: errorMsg,
        }
    }

    return { isValid: true }
}

/**
 * Validates file size against configured limits
 */
export const validateFileSize = (file: File, type: MediaType): ValidationResult => {
    const sizeLimit = STORAGE.SIZE_LIMITS[type]

    if (file.size > sizeLimit) {
        const sizeMB = (sizeLimit / 1024 / 1024).toFixed(0)
        const errorMsg = `${type.charAt(0).toUpperCase() + type.slice(1)} too large. Maximum: ${sizeMB}MB`
        toast.error(errorMsg)
        return {
            isValid: false,
            error: errorMsg,
        }
    }

    return { isValid: true }
}

/**
 * Validates both MIME type and file size
 */
export const validateFile = (file: File, type: MediaType): ValidationResult => {
    const mimeValidation = validateMimeType(file, type)
    if (!mimeValidation.isValid) {
        return mimeValidation
    }

    const sizeValidation = validateFileSize(file, type)
    if (!sizeValidation.isValid) {
        return sizeValidation
    }

    return { isValid: true }
}

/**
 * Compresses image files using browser-image-compression library
 * 
 * @param file - Original image file
 * @returns Compressed image file
 */
export const compressImage = async (file: File): Promise<File> => {
    try {
        logger.info('media:compression:started', `Compressing ${file.type} - Size: ${file.size} bytes`)

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        }

        const compressedFile = await imageCompression(file, options)

        const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
        logger.info(
            'media:compression:success',
            `Compressed from ${file.size} to ${compressedFile.size} bytes (${compressionRatio}% reduction)`
        )

        return compressedFile
    } catch (error) {
        logger.error('media:compression:failed', 'Image compression failed', error)
        // Return original file on compression failure
        return file
    }
}

/**
 * Validates and compresses image file if valid
 */
export const validateAndCompressImage = async (file: File): Promise<{
    isValid: boolean
    file?: File
    error?: string
}> => {
    const validation = validateFile(file, 'image')

    if (!validation.isValid) {
        return {
            isValid: false,
            error: validation.error,
        }
    }

    const compressedFile = await compressImage(file)

    return {
        isValid: true,
        file: compressedFile,
    }
}
