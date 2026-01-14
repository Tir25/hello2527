/**
 * Media-related constants
 * Centralized constants for media handling across the application
 */

/**
 * Placeholder text used when a message contains media but no text content
 * This constant should be used consistently across:
 * - MessageBubble.tsx (for display logic)
 * - chat.service.ts (when sending messages)
 * - useChat.ts (for optimistic updates)
 */
export const MEDIA_PLACEHOLDER = '[Media]' as const

/**
 * Media type definitions matching the database schema
 */
export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
} as const

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES]

/**
 * Responsive max-width classes for media elements
 * Ensures media displays appropriately across different screen sizes
 */
export const MEDIA_MAX_WIDTH = {
  mobile: 'max-w-[280px]',
  tablet: 'sm:max-w-[320px]',
  desktop: 'md:max-w-[360px]',
  full: 'max-w-[280px] sm:max-w-[320px] md:max-w-[360px]',
} as const

