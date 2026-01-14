/**
 * Profile Feature Types
 * 
 * Centralized type definitions for the profile feature.
 * All profile-related interfaces and types live here.
 */

import { z } from 'zod'

// Profile schema for validation - matches editable fields (excludes username)
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters').optional(),
  status: z.string().max(100, 'Status must be less than 100 characters').optional(),
  avatar_url: z.string().url().optional(),
})

// Username validation schema (separate as it uses RPC, not direct update)
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-z][a-z0-9_]*[a-z0-9]$/, 'Username must start with a letter, end with letter/number, and contain only lowercase letters, numbers, and underscores')
  .refine(val => !val.includes('__'), 'Username cannot contain consecutive underscores')

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

export type RelationshipStatus = 'none' | 'pending' | 'accepted' | 'blocked'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  phone: string | null
  avatar_url: string | null
  status: string | null
  last_seen: string | null
  created_at: string | null
  theme_color?: string
  relationship_status?: RelationshipStatus
  relationship_id?: string
  is_requester?: boolean
  is_blocker?: boolean
  /** True if current user follows this profile */
  amIFollowing?: boolean
  /** True if this profile follows the current user */
  isFollowingMe?: boolean
  /** True if current user has sent a pending follow request to this profile */
  isPendingOutgoing?: boolean
  /** True if this profile has sent a pending follow request to current user */
  isPendingIncoming?: boolean
}

export interface ProfileResponse {
  success: boolean
  error?: string
  data?: Profile
}

export interface RelationshipResponse {
  success: boolean
  error?: string
  relationship_id?: string
}

export interface AvatarUploadResponse {
  success: boolean
  error?: string
  url?: string
}

// Cache types
export interface CacheEntry {
  data: Profile
  timestamp: number
}

// Confirm dialog state
export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => Promise<void>
  confirmLabel: string
  variant: 'danger' | 'warning'
}

// Profile header props
export interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  onProfileUpdate?: () => void
}

// Profile stats - Instagram-style with followers/following
export interface ProfileStats {
  posts: number
  followers: number
  following: number
  joinedDate: number | null
}
