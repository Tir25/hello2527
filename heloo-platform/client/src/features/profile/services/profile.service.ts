/**
 * Profile Service
 * 
 * Core profile operations (get, update).
 * Relationship operations are in relationship/
 * Avatar operations are in avatar.service.ts
 * 
 * @module features/profile/services/profile.service
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { profileCacheService } from './profile-cache.service'
import { fetchProfileData } from './profile-fetch.service'
import { fetchRelationshipData, type RelationshipData } from './relationship/statusQueries'
import { profileUpdateSchema } from '../types/profile.types'
import type { Profile, ProfileResponse, ProfileUpdateData } from '../types/profile.types'

// Re-export types for backward compatibility
export type { Profile, ProfileResponse, ProfileUpdateData }

export const profileService = {
  /**
   * Get profile with optional relationship data
   */
  async getProfile(userId: string, skipCache = false, includeRelationship = true): Promise<ProfileResponse> {
    if (!skipCache && !includeRelationship) {
      const cached = profileCacheService.getCached(userId)
      if (cached) {
        if (import.meta.env.DEV) logger.info('profile:getProfile', `Served from cache: ${userId}`)
        return { success: true, data: cached }
      }
    }

    const pendingRequest = profileCacheService.getPendingRequest(userId)
    if (pendingRequest) {
      if (import.meta.env.DEV) logger.info('profile:getProfile', `Deduplicating request: ${userId}`)
      return pendingRequest
    }

    const requestPromise = this.fetchProfile(userId, includeRelationship)
    profileCacheService.setPendingRequest(userId, requestPromise)
    return requestPromise
  },

  /**
   * Fetch profile (internal)
   */
  async fetchProfile(userId: string, includeRelationship: boolean): Promise<ProfileResponse> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const currentUserId = currentUser?.id

      const { data: profileData, result } = await fetchProfileData(userId, currentUserId)

      if (!result.success) {
        profileCacheService.removePendingRequest(userId)
        return result
      }

      let relationshipData: RelationshipData = {
        status: 'none',
        id: undefined,
        isRequester: undefined,
        isBlocker: undefined,
        amIFollowing: undefined,
        isFollowingMe: undefined,
        isPendingOutgoing: undefined,
        isPendingIncoming: undefined,
      }

      if (includeRelationship && currentUserId && currentUserId !== userId) {
        relationshipData = await fetchRelationshipData(userId, currentUserId, result.publicStatus)
      }

      const profile: Profile = {
        ...profileData!,
        relationship_status: relationshipData.status,
        relationship_id: relationshipData.id,
        is_requester: relationshipData.isRequester,
        is_blocker: relationshipData.isBlocker,
        amIFollowing: relationshipData.amIFollowing,
        isFollowingMe: relationshipData.isFollowingMe,
        isPendingOutgoing: relationshipData.isPendingOutgoing,
        isPendingIncoming: relationshipData.isPendingIncoming,
      }

      if (profileData) profileCacheService.setCache(userId, profileData)
      profileCacheService.removePendingRequest(userId)
      logger.info('profile:getProfile', `Fetched successfully: ${userId}`)

      return { success: true, data: profile }
    } catch (error) {
      profileCacheService.removePendingRequest(userId)
      logger.error('profile:getProfile', 'Unexpected error', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  /**
   * Update profile
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const validated = profileUpdateSchema.parse(updates)

      const { data, error } = await supabase
        .from('profiles')
        .update(validated)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        logger.error('profile:update', 'Failed to update', error)
        return { success: false, error: error.message || 'Failed to update profile' }
      }

      logger.info('profile:update', `Updated: ${userId}`)
      profileCacheService.setCache(userId, data as Profile)
      return { success: true, data: data as Profile }
    } catch (error) {
      logger.error('profile:update', 'Validation or request failed', error)
      return {
        success: false,
        error: error instanceof z.ZodError
          ? error.issues.map(i => i.message).join(', ')
          : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Clear cache for a user
   */
  clearCache(userId: string): void {
    profileCacheService.clearCache(userId)
  },
}
