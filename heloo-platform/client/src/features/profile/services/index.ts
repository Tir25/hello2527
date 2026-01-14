/**
 * Profile Services - Barrel Export
 * 
 * Re-exports all profile-related services for clean imports
 */

export { profileService } from './profile.service'
export { relationshipService } from './relationship'
export { avatarService } from './avatar.service'
export { profileCacheService } from './profile-cache.service'

// Re-export types
export type {
  Profile,
  ProfileResponse,
  ProfileUpdateData,
  RelationshipStatus,
  RelationshipResponse,
  AvatarUploadResponse,
  ConfirmDialogState,
  ProfileHeaderProps,
  ProfileStats,
} from '../types/profile.types'
