/**
 * Avatar Service
 * 
 * Responsibility: Handle avatar upload operations
 * Layer: Service (Data)
 * 
 * Max lines: ~130
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { profileCacheService } from './profile-cache.service'
import type { AvatarUploadResponse, Profile } from '../types/profile.types'

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const avatarService = {
  /**
   * Upload avatar image
   */
  async uploadAvatar(
    userId: string,
    file: File,
    signal?: AbortSignal
  ): Promise<AvatarUploadResponse> {
    try {
      // Validate file type
      if (!VALID_TYPES.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
        }
      }

      // Validate file size
      if (file.size > MAX_SIZE) {
        return {
          success: false,
          error: 'File size must be less than 5MB.',
        }
      }

      // Check if cancelled
      if (signal?.aborted) {
        return { success: false, error: 'Upload was cancelled' }
      }

      // Create file path
      const timestamp = Date.now()
      const fileName = `${userId}/${timestamp}-${file.name}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '31536000',  // 1 year cache
        })

      if (signal?.aborted) {
        await this.cleanupFile(fileName)
        return { success: false, error: 'Upload was cancelled' }
      }

      if (uploadError) {
        logger.error('avatar:upload', 'Failed to upload', uploadError)
        return { success: false, error: uploadError.message || 'Failed to upload avatar' }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)

      if (signal?.aborted) {
        await this.cleanupFile(fileName)
        return { success: false, error: 'Upload was cancelled' }
      }

      // Update profile with avatar URL
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId)
        .select()
        .single()

      if (signal?.aborted) {
        await this.cleanupFile(fileName)
        return { success: false, error: 'Upload was cancelled' }
      }

      if (updateError) {
        logger.error('avatar:upload', 'Failed to update profile', updateError)
        await this.cleanupFile(fileName)
        return { success: false, error: 'Avatar uploaded but failed to update profile' }
      }

      logger.info('avatar:upload', `Avatar uploaded for user: ${userId}`)

      // Update cache
      if (updatedProfile) {
        profileCacheService.setCache(userId, updatedProfile as Profile)
      } else {
        profileCacheService.clearCache(userId)
      }

      return { success: true, url: urlData.publicUrl }
    } catch (error) {
      logger.error('avatar:upload', 'Unexpected error', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  /**
   * Cleanup uploaded file (helper)
   */
  async cleanupFile(fileName: string): Promise<void> {
    try {
      await supabase.storage.from('avatars').remove([fileName])
    } catch {
      // Ignore cleanup errors
    }
  },
}
