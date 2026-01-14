/**
 * Media Upload Service
 * 
 * Responsibility: Handle file uploads to Supabase Storage
 * Layer: Service (Data)
 * 
 * Max lines: ~130
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { STORAGE } from '@/lib/constants/storage'

export interface MediaUploadResponse {
    publicUrl: string
    path: string
}

export interface MediaServiceResponse<T = unknown> {
    success: boolean
    error?: string
    data?: T
}

// MIME type mapping for fallback detection
const MIME_MAP: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'csv': 'text/csv',
}

/**
 * Get MIME type from file, with extension fallback
 */
const getContentType = (file: File): string => {
    if (file.type) return file.type

    const ext = file.name.split('.').pop()?.toLowerCase()
    return ext && MIME_MAP[ext] ? MIME_MAP[ext] : 'application/octet-stream'
}

export const mediaUploadService = {
    /**
     * Upload media file to Supabase Storage
     */
    async upload(
        file: File,
        fileType: 'image' | 'video' | 'document' | 'audio'
    ): Promise<MediaServiceResponse<MediaUploadResponse>> {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                logger.error('mediaUpload:upload', 'User not authenticated')
                return { success: false, error: 'storage/unauthenticated' }
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop() || 'bin'
            const timestamp = Date.now()
            const random = Math.random().toString(36).substring(7)
            const fileName = `${timestamp}-${random}.${fileExt}`
            const filePath = STORAGE.PATH_TEMPLATE(user.id, fileName)

            const contentType = getContentType(file)

            logger.info('mediaUpload:upload', 'Starting upload', {
                type: fileType,
                size: file.size,
                path: filePath,
                contentType,
            })

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(STORAGE.BUCKET)
                .upload(filePath, file, {
                    cacheControl: STORAGE.CACHE_CONTROL,
                    contentType: contentType,
                    upsert: false,
                })

            if (uploadError) {
                logger.error('mediaUpload:upload', 'Failed to upload file', {
                    error: uploadError,
                    message: uploadError.message,
                    path: filePath,
                })
                return { success: false, error: uploadError.message || 'storage/upload-failed' }
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE.BUCKET)
                .getPublicUrl(filePath)

            if (!publicUrl) {
                logger.error('mediaUpload:upload', 'Failed to get public URL', { path: filePath })
                return { success: false, error: 'storage/url-generation-failed' }
            }

            logger.info('mediaUpload:upload', 'File uploaded successfully', {
                path: filePath,
                url: publicUrl,
                size: file.size,
                type: fileType,
            })

            return {
                success: true,
                data: { publicUrl, path: filePath },
            }
        } catch (error) {
            logger.error('mediaUpload:upload', 'Upload failed', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            }
        }
    },
}
