import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Profile schema for validation - matches editable fields in ProfilePage
const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters').optional(),
  status: z.string().max(100, 'Status must be less than 100 characters').optional(),
  avatar_url: z.string().url().optional(), // Allow avatar_url updates (used internally by uploadAvatar)
})

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

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
}

interface ProfileResponse {
  success: boolean
  error?: string
  data?: Profile
}

// Request deduplication: Track in-flight requests to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<ProfileResponse>>()

// Cache: Store recent profile data to avoid unnecessary refetches
interface CacheEntry {
  data: Profile
  timestamp: number
}

const profileCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5000 // 5 seconds cache TTL

export const profileService = {
  async getProfile(userId: string, skipCache = false): Promise<ProfileResponse> {
    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cached = profileCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.info('profile:getProfile', `Profile served from cache for user: ${userId}`)
        return {
          success: true,
          data: cached.data,
        }
      }
    }

    // Check if there's already a pending request for this user
    const pendingRequest = pendingRequests.get(userId)
    if (pendingRequest) {
      logger.info('profile:getProfile', `Deduplicating request for user: ${userId}`)
      return pendingRequest
    }

    // Create new request
    const requestPromise = (async (): Promise<ProfileResponse> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        // Remove from pending requests
        pendingRequests.delete(userId)

        if (error) {
          logger.error('profile:getProfile', 'Failed to fetch profile', error)
          return {
            success: false,
            error: error.message || 'Failed to fetch profile',
          }
        }

        // Cache the result
        if (data) {
          profileCache.set(userId, {
            data: data as Profile,
            timestamp: Date.now(),
          })
        }

        logger.info('profile:getProfile', `Profile fetched successfully for user: ${userId}`)
        return {
          success: true,
          data: data as Profile,
        }
      } catch (error) {
        // Remove from pending requests on error
        pendingRequests.delete(userId)
        logger.error('profile:getProfile', 'Unexpected error fetching profile', error)
        return {
          success: false,
          error: 'An unexpected error occurred',
        }
      }
    })()

    // Store pending request
    pendingRequests.set(userId, requestPromise)

    return requestPromise
  },

  // Clear cache for a specific user (useful after profile updates)
  clearCache(userId: string): void {
    profileCache.delete(userId)
  },

  async updateProfile(
    userId: string,
    updates: ProfileUpdateData
  ): Promise<ProfileResponse> {
    try {
      // Validate input
      const validated = profileUpdateSchema.parse(updates)

      const { data, error } = await supabase
        .from('profiles')
        .update(validated)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        logger.error('profile:updateProfile', 'Failed to update profile', error)
        return {
          success: false,
          error: error.message || 'Failed to update profile',
        }
      }

      logger.info('profile:updateProfile', `Profile updated successfully for user: ${userId}`)
      
      // Clear cache and update with new data
      profileCache.set(userId, {
        data: data as Profile,
        timestamp: Date.now(),
      })
      
      return {
        success: true,
        data: data as Profile,
      }
    } catch (error) {
      logger.error('profile:updateProfile', 'Profile update validation or request failed', error)
      return {
        success: false,
        error:
          error instanceof z.ZodError
            ? error.issues.map(issue => issue.message).join(', ')
            : 'An unexpected error occurred',
      }
    }
  },

  async uploadAvatar(
    userId: string,
    file: File,
    signal?: globalThis.AbortSignal
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
        }
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size must be less than 5MB.',
        }
      }

      // Create file path: {userId}/{timestamp}-{file.name}
      const timestamp = Date.now()
      const fileName = `${userId}/${timestamp}-${file.name}`

      // Upload to Supabase Storage
      // Note: Supabase storage doesn't support AbortSignal directly,
      // but we check signal before and after operations
      if (signal?.aborted) {
        return {
          success: false,
          error: 'Upload was cancelled',
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true, // Replace existing avatar
        })

      if (signal?.aborted) {
        // Cleanup uploaded file if upload was aborted
        try {
          await supabase.storage.from('avatars').remove([fileName])
        } catch {
          // Ignore cleanup errors
        }
        return {
          success: false,
          error: 'Upload was cancelled',
        }
      }

      if (uploadError) {
        logger.error('profile:uploadAvatar', 'Failed to upload avatar', uploadError)
        return {
          success: false,
          error: uploadError.message || 'Failed to upload avatar',
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)

      if (signal?.aborted) {
        // Cleanup uploaded file if operation was aborted
        try {
          await supabase.storage.from('avatars').remove([fileName])
        } catch {
          // Ignore cleanup errors
        }
        return {
          success: false,
          error: 'Upload was cancelled',
        }
      }

      // Update profile with avatar URL and get updated profile in one call
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId)
        .select()
        .single()

      if (signal?.aborted) {
        // Cleanup uploaded file if operation was aborted
        try {
          await supabase.storage.from('avatars').remove([fileName])
        } catch {
          // Ignore cleanup errors
        }
        return {
          success: false,
          error: 'Upload was cancelled',
        }
      }

      if (updateError) {
        logger.error('profile:uploadAvatar', 'Failed to update profile with avatar URL', updateError)
        // Attempt to clean up uploaded file (best effort, don't fail if cleanup fails)
        try {
          await supabase.storage.from('avatars').remove([fileName])
        } catch (cleanupError) {
          logger.error('profile:uploadAvatar', 'Failed to cleanup uploaded file after profile update failure', cleanupError)
        }
        return {
          success: false,
          error: 'Avatar uploaded but failed to update profile',
        }
      }

      logger.info('profile:uploadAvatar', `Avatar uploaded successfully for user: ${userId}`)
      
      // Update cache with new profile data (consistent with updateProfile behavior)
      if (updatedProfile) {
        profileCache.set(userId, {
          data: updatedProfile as Profile,
          timestamp: Date.now(),
        })
      } else {
        // If no data returned, clear cache to force refetch on next access
        profileCache.delete(userId)
      }
      
      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error) {
      logger.error('profile:uploadAvatar', 'Unexpected error uploading avatar', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  },
}

