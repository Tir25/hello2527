/**
 * Profile Service - Backward Compatibility Layer
 * 
 * This file re-exports from the new feature-based structure
 * for backward compatibility with existing imports.
 * 
 * NEW IMPORTS SHOULD USE:
 * import { profileService } from '@/features/profile'
 */

// Import services from new location
import { profileService as _profileService } from '@/features/profile/services/profile.service'
import { relationshipService } from '@/features/profile/services/relationship'
import { avatarService } from '@/features/profile/services/avatar.service'

// Re-export types
export type {
  Profile,
  ProfileResponse,
  ProfileUpdateData
} from '@/features/profile/types/profile.types'

// Combined service object for backward compatibility
// Old code expects profileService.sendRequest, profileService.acceptRequest, etc.
export const profileService = {
  // Profile operations
  getProfile: _profileService.getProfile.bind(_profileService),
  updateProfile: _profileService.updateProfile.bind(_profileService),
  clearCache: _profileService.clearCache.bind(_profileService),

  // Relationship operations (from relationshipService)
  sendRequest: relationshipService.sendRequest.bind(relationshipService),
  followUser: relationshipService.followUser.bind(relationshipService), // Uses UPSERT - preferred
  cancelRequest: relationshipService.cancelRequest.bind(relationshipService),
  acceptRequest: relationshipService.acceptRequest.bind(relationshipService),
  acceptChatRequest: relationshipService.acceptChatRequest.bind(relationshipService),
  declineRequest: relationshipService.declineRequest.bind(relationshipService),
  unfollow: relationshipService.unfollow.bind(relationshipService),
  blockUser: relationshipService.blockUser.bind(relationshipService),
  unblockUser: relationshipService.unblockUser.bind(relationshipService),
  getIncomingRequests: relationshipService.getIncomingRequests.bind(relationshipService),

  // Avatar operations (from avatarService)
  uploadAvatar: avatarService.uploadAvatar.bind(avatarService),
}

// Also export individual services for new code
export { relationshipService, avatarService }
