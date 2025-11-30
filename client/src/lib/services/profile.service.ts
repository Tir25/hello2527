import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Profile schema for validation
const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  status: z.string().max(100, 'Status must be less than 100 characters').optional(),
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

export const profileService = {
  async getProfile(userId: string): Promise<ProfileResponse> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('profile:getProfile', 'Failed to fetch profile', error)
        return {
          success: false,
          error: error.message || 'Failed to fetch profile',
        }
      }

      logger.info('profile:getProfile', `Profile fetched successfully for user: ${userId}`)
      return {
        success: true,
        data: data as Profile,
      }
    } catch (error) {
      logger.error('profile:getProfile', 'Unexpected error fetching profile', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
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

  async uploadAvatar(userId: string, file: File): Promise<{ success: boolean; error?: string; url?: string }> {
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

      // Create file path: {userId}/avatar.{ext}
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true, // Replace existing avatar
        })

      if (uploadError) {
        logger.error('profile:uploadAvatar', 'Failed to upload avatar', uploadError)
        return {
          success: false,
          error: uploadError.message || 'Failed to upload avatar',
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId)

      if (updateError) {
        logger.error('profile:uploadAvatar', 'Failed to update profile with avatar URL', updateError)
        return {
          success: false,
          error: 'Avatar uploaded but failed to update profile',
        }
      }

      logger.info('profile:uploadAvatar', `Avatar uploaded successfully for user: ${userId}`)
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

