/**
 * Storage configuration constants
 * Centralized configuration for Supabase Storage operations
 */
export const STORAGE = {
  BUCKET: 'chat-media',
  CACHE_CONTROL: '3600',
  
  /**
   * Generate file path for storage upload
   * Format: {userId}/{timestamp}-{random}.{ext}
   */
  PATH_TEMPLATE: (userId: string, filename: string) => `${userId}/${filename}`,
  
  /**
   * File size limits in bytes
   */
  SIZE_LIMITS: {
    image: 10 * 1024 * 1024,   // 10MB (after compression should be ~1MB)
    video: 15 * 1024 * 1024,   // 15MB
    document: 5 * 1024 * 1024, // 5MB
    audio: 10 * 1024 * 1024,   // 10MB
  } as const,
  
  /**
   * Valid MIME types for each file category
   */
  VALID_MIME_TYPES: {
    image: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    video: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    audio: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
    ],
  } as const,
} as const

/**
 * User-friendly error messages for storage operations
 */
export const STORAGE_ERROR_MESSAGES: Record<string, string> = {
  'storage/unauthorized': "You don't have permission to upload files",
  'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  'storage/unauthenticated': 'Please log in to upload files',
  'storage/object-not-found': 'File not found',
  'storage/bucket-not-found': 'Storage bucket not configured. Please contact support.',
  'storage/too-large': 'File is too large',
  'storage/invalid-mime-type': 'File type not supported',
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error: string | undefined): string => {
  if (!error) return 'Failed to upload media. Please try again.'
  
  // Check for known error patterns
  for (const [key, message] of Object.entries(STORAGE_ERROR_MESSAGES)) {
    if (error.includes(key) || error.toLowerCase().includes(key.replace('storage/', ''))) {
      return message
    }
  }
  
  return 'Failed to upload media. Please try again.'
}

