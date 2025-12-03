/**
 * Media utility functions
 * Utility functions for media handling, sanitization, and validation
 */

/**
 * Sanitizes a filename to prevent XSS attacks and filesystem issues
 * 
 * @param filename - The filename to sanitize
 * @returns A sanitized filename safe for use in download attributes
 * 
 * Security considerations:
 * - Removes all characters except alphanumeric, dots, underscores, and hyphens
 * - Limits length to 255 characters (common filesystem limit)
 * - Prevents path traversal and script injection
 * 
 * @example
 * sanitizeFilename("my file<script>.pdf") // "my_file_pdf"
 * sanitizeFilename("../../../etc/passwd") // "etc_passwd"
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename || typeof filename !== 'string') {
    return 'document'
  }

  // Remove any path components and get just the filename
  const baseFilename = filename.split('/').pop() || filename
  const nameWithoutExtension = baseFilename.split('.').slice(0, -1).join('.')
  const extension = baseFilename.includes('.') 
    ? '.' + baseFilename.split('.').pop() 
    : ''

  // Sanitize: only allow alphanumeric, dots, underscores, hyphens
  // Replace all other characters with underscore
  const sanitized = nameWithoutExtension
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores

  // Limit length (255 is common filesystem limit, reserve space for extension)
  const maxLength = 255 - extension.length
  const truncated = sanitized.substring(0, maxLength)

  // Ensure we have at least a basic name
  const finalName = truncated || 'document'

  return finalName + extension
}

/**
 * Extracts filename from a URL
 * Handles various URL formats and edge cases
 * 
 * @param url - The URL to extract filename from
 * @returns The extracted filename, or 'Document' if extraction fails
 * 
 * @example
 * getFilenameFromUrl("https://example.com/files/document.pdf") // "document.pdf"
 * getFilenameFromUrl("https://example.com/files/document.pdf?token=123") // "document.pdf"
 */
export const getFilenameFromUrl = (url: string | null): string => {
  if (!url) return 'Document'
  
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || 'Document'
    
    // Remove query parameters if any
    const cleanFilename = filename.split('?')[0]
    
    // Decode URL-encoded characters
    return decodeURIComponent(cleanFilename)
  } catch {
    // If URL parsing fails, try to extract from string
    try {
      const parts = url.split('/')
      const filename = parts[parts.length - 1]?.split('?')[0] || 'Document'
      return decodeURIComponent(filename)
    } catch {
      return 'Document'
    }
  }
}

/**
 * Gets a sanitized filename from a URL
 * Combines URL extraction with sanitization for safe use in download attributes
 * 
 * @param url - The URL to extract and sanitize filename from
 * @returns A sanitized filename safe for download attribute
 */
export const getSanitizedFilenameFromUrl = (url: string | null): string => {
  const extracted = getFilenameFromUrl(url)
  return sanitizeFilename(extracted)
}

