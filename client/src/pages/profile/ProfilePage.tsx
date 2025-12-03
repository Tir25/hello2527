import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { profileService, type Profile } from '@/lib/services/profile.service'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
  status: z.string().max(100, 'Status must be less than 100 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [profile, setLocalProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [statusLength, setStatusLength] = useState(0)
  const uploadAbortControllerRef = useRef<globalThis.AbortController | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  // Watch status field for character counter
  const statusValue = watch('status') || ''

  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const result = await profileService.getProfile(user.id, true) // Skip cache to get fresh data

      if (!result.success) {
        toast.error(result.error || 'Failed to load profile')
        logger.error('ProfilePage:loadProfile', 'Failed to load profile', result.error)
        return
      }

      if (result.data) {
        setLocalProfile(result.data)
      }
    } catch (err) {
      logger.error('ProfilePage:loadProfile', 'Unexpected error loading profile', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Separate effect to reset form when profile changes
  // Use ref to track if we've already reset to prevent infinite loops
  const resetRef = useRef<string | null>(null)
  useEffect(() => {
    if (profile && resetRef.current !== profile.id) {
      const status = profile.status || ''
      setStatusLength(status.length)
      reset({
        full_name: profile.full_name || '',
        status: status,
      })
      resetRef.current = profile.id
    }
  }, [profile, reset])

  // Update character counter when status value changes
  useEffect(() => {
    setStatusLength(statusValue.length)
  }, [statusValue])

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id, loadProfile])

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) {
      toast.error('Session expired. Please log in again.')
      navigate('/login')
      return
    }

    try {
      setSaving(true)

      const result = await profileService.updateProfile(user.id, {
        full_name: data.full_name,
        status: data.status || undefined,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to update profile')
        logger.error('ProfilePage:onSubmit', 'Failed to update profile', result.error)
        return
      }

      if (result.data) {
        setLocalProfile(result.data)
        // Update global auth store
        setProfile(result.data)
        toast.success('Profile updated successfully!')
        logger.info('ProfilePage:onSubmit', 'Profile updated successfully')
      }
    } catch (err) {
      logger.error('ProfilePage:onSubmit', 'Unexpected error updating profile', err)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) {
      toast.error('Session expired. Please log in again.')
      navigate('/login')
      return
    }

    // Cancel previous upload if still running
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort()
      logger.info('ProfilePage:handleAvatarUpload', 'Cancelled previous upload')
    }

    // Create new abort controller for this upload
    const abortController = new globalThis.AbortController()
    uploadAbortControllerRef.current = abortController

    try {
      setUploading(true)

      const result = await profileService.uploadAvatar(user.id, file, abortController.signal)

      // Check if upload was aborted
      if (abortController.signal.aborted) {
        logger.info('ProfilePage:handleAvatarUpload', 'Upload was aborted')
        return
      }

      if (!result.success) {
        toast.error(result.error || 'Failed to upload avatar')
        logger.error('ProfilePage:handleAvatarUpload', 'Failed to upload avatar', result.error)
        return
      }

      // The service already updates the cache, but we need to refresh local state
      // Fetch fresh profile to ensure we have the latest data
      const profileResult = await profileService.getProfile(user.id, true)
      if (profileResult.success && profileResult.data) {
        setLocalProfile(profileResult.data)
        setProfile(profileResult.data) // Update global auth store
        resetRef.current = profileResult.data.id // Update reset ref
        toast.success('Avatar updated successfully!')
        logger.info('ProfilePage:handleAvatarUpload', 'Avatar uploaded successfully')
      } else {
        // Even if fetch fails, the avatar was uploaded successfully
        // The cache should have been updated by the service
        toast.success('Avatar uploaded successfully!')
        logger.warn('ProfilePage:handleAvatarUpload', 'Avatar uploaded but profile fetch failed, cache may be stale')
      }
    } catch (err) {
      // Check if error is due to abort
      if (err instanceof Error && err.name === 'AbortError') {
        logger.info('ProfilePage:handleAvatarUpload', 'Upload was aborted')
        return
      }
      logger.error('ProfilePage:handleAvatarUpload', 'Unexpected error uploading avatar', err)
      toast.error('An unexpected error occurred')
    } finally {
      // Only clear uploading state if this is still the active upload
      if (uploadAbortControllerRef.current === abortController) {
        setUploading(false)
        uploadAbortControllerRef.current = null
      }
    }
  }

  // Cleanup: Cancel upload if component unmounts
  useEffect(() => {
    return () => {
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center text-white/80">
        <p>Failed to load profile. Please try again.</p>
        <Button onClick={loadProfile} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Liquid Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-cyan-900">
        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
      </div>

      {/* Floating Blobs Animation */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Back to chat"
            >
              <ArrowLeft size={24} className="text-white" />
            </motion.button>
            <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex justify-center mb-6">
              <AvatarUpload
                avatarUrl={profile.avatar_url}
                onFileSelect={handleAvatarUpload}
                uploading={uploading}
                profile={profile}
                isOnline={true}
              />
            </div>

            {/* Full Name Input */}
            <Input
              id="full_name"
              type="text"
              label="Display Name"
              placeholder="Enter your display name"
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            {/* Status/Bio Textarea */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                About / Status
              </label>
              <textarea
                id="status"
                placeholder="Tell us about yourself..."
                maxLength={100}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                {...register('status')}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.status && (
                  <p className="text-sm text-red-300 font-medium">
                    {errors.status.message}
                  </p>
                )}
                <p className="text-xs text-white/60 ml-auto">
                  {statusLength}/100 characters
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              className="w-full flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Save size={20} />
              Save Changes
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
