/**
 * Profile Feature - Main Export
 * 
 * This is the main entry point for the profile feature.
 * Import from here for clean, organized imports.
 */

// Main page component
export { ProfilePage } from './ProfilePage'

// Services
export { 
  profileService, 
  relationshipService, 
  avatarService,
  profileCacheService,
} from './services'

// Hooks
export { useProfileHeader, useProfilePage } from './hooks'

// Components (for direct use if needed)
export {
  ProfileHeader,
  ProfileContent,
  PrivateAccountView,
  ProfileLoadingState,
  ProfileErrorState,
  BackgroundBlobs,
} from './components'

// Types
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
} from './types/profile.types'
