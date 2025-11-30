import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Edit2, Save, X, Camera } from 'lucide-react'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { profileService, type Profile } from '@/lib/services/profile.service'
import { logger } from '@/lib/logger'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  status: z.string().max(100, 'Status must be less than 100 characters'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export const ProfilePage = () => {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const result = await profileService.getProfile(user.id)

      if (!result.success) {
        setError(result.error || 'Failed to load profile')
        logger.error('ProfilePage:loadProfile', 'Failed to load profile', result.error)
        return
      }

      if (result.data) {
        setProfile(result.data)
        reset({
          full_name: result.data.full_name || '',
          username: result.data.username || '',
          phone: result.data.phone || '',
          status: result.data.status || '',
        })
      }
    } catch (err) {
      logger.error('ProfilePage:loadProfile', 'Unexpected error loading profile', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [user?.id, reset])

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id, loadProfile])

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const result = await profileService.updateProfile(user.id, data)

      if (!result.success) {
        setError(result.error || 'Failed to update profile')
        logger.error('ProfilePage:onSubmit', 'Failed to update profile', result.error)
        return
      }

      if (result.data) {
        setProfile(result.data)
        setIsEditing(false)
        setSuccess('Profile updated successfully!')
        logger.info('ProfilePage:onSubmit', 'Profile updated successfully')

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      logger.error('ProfilePage:onSubmit', 'Unexpected error updating profile', err)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      const result = await profileService.uploadAvatar(user.id, file)

      if (!result.success) {
        setError(result.error || 'Failed to upload avatar')
        logger.error('ProfilePage:handleAvatarUpload', 'Failed to upload avatar', result.error)
        return
      }

      // Reload profile to get updated avatar URL
      await loadProfile()
      setSuccess('Avatar updated successfully!')
      logger.info('ProfilePage:handleAvatarUpload', 'Avatar uploaded successfully')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      logger.error('ProfilePage:handleAvatarUpload', 'Unexpected error uploading avatar', err)
      setError('An unexpected error occurred')
    } finally {
      setUploading(false)
    }
  }

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit
            </Button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-400/50 text-green-200 text-sm"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden border-4 border-white/20">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} className="text-white/60" />
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 cursor-pointer transition-colors">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {uploading && (
            <p className="mt-2 text-white/60 text-sm">Uploading avatar...</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            id="email"
            type="email"
            label="Email"
            value={profile.email}
            icon={Mail}
            iconPosition="left"
            disabled
            className="opacity-60"
          />

          <Input
            id="full_name"
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            icon={User}
            iconPosition="left"
            error={errors.full_name?.message}
            disabled={!isEditing}
            {...register('full_name')}
          />

          <Input
            id="username"
            type="text"
            label="Username"
            placeholder="Enter your username"
            icon={User}
            iconPosition="left"
            error={errors.username?.message}
            disabled={!isEditing}
            {...register('username')}
          />

          <Input
            id="phone"
            type="tel"
            label="Phone Number"
            placeholder="Enter your phone number"
            icon={Phone}
            iconPosition="left"
            error={errors.phone?.message}
            disabled={!isEditing}
            {...register('phone')}
          />

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Status
            </label>
            <textarea
              id="status"
              placeholder="What's on your mind?"
              disabled={!isEditing}
              maxLength={100}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              rows={3}
              {...register('status')}
            />
            {errors.status && (
              <p className="mt-1 text-red-400 text-sm">{errors.status.message}</p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={saving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false)
                  reset()
                  setError(null)
                }}
                className="flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  )
}

