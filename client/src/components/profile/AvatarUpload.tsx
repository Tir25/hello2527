import { useState, useRef, useCallback, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from '@/store/toastStore'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/lib/services/profile.service'

interface AvatarUploadProps {
  avatarUrl: string | null
  onFileSelect: (file: File) => void
  uploading?: boolean
  className?: string
  profile?: Profile | null
  isOnline?: boolean
}

export const AvatarUpload = ({
  avatarUrl,
  onFileSelect,
  uploading = false,
  className,
  profile,
  isOnline = false,
}: AvatarUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track revoked URLs to prevent double revocation
  const revokedUrlsRef = useRef<Set<string>>(new Set())

  // Safe URL revocation helper
  const safeRevokeObjectURL = useCallback((url: string) => {
    if (url && !revokedUrlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url)
        revokedUrlsRef.current.add(url)
      } catch {
        // URL already revoked or invalid, ignore
      }
    }
  }, [])

  // Cleanup blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        safeRevokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl, safeRevokeObjectURL])

  // Clear preview when avatarUrl changes (after successful upload)
  useEffect(() => {
    if (avatarUrl && previewUrl) {
      // If we have a new avatar URL from server, clear the preview blob
      const currentPreview = previewUrl
      setPreviewUrl(null)
      // Revoke after state update to avoid race conditions
      safeRevokeObjectURL(currentPreview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl]) // Only depend on avatarUrl - previewUrl is handled in cleanup effect above

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        event.target.value = '' // Reset input
        return
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB')
        event.target.value = '' // Reset input
        return
      }

      // Revoke previous blob URL if exists
      if (previewUrl) {
        safeRevokeObjectURL(previewUrl)
      }

      // Create preview URL
      const blobUrl = URL.createObjectURL(file)
      revokedUrlsRef.current.delete(blobUrl) // Remove from revoked set if it was there
      setPreviewUrl(blobUrl)

      // Call parent handler
      onFileSelect(file)
    },
    [onFileSelect, previewUrl, safeRevokeObjectURL]
  )

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  // Create a profile object for Avatar component if we have preview or avatarUrl
  const displayProfile: Profile | null = profile
    ? {
        ...profile,
        avatar_url: previewUrl || avatarUrl || profile.avatar_url,
      }
    : null

  return (
    <div className={cn('flex justify-center', className)}>
      <motion.div
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload avatar image"
      >
        {/* Use Avatar component for display */}
        <div className="relative">
          <Avatar profile={displayProfile} size="xl" isOnline={isOnline} />

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full z-20">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Hover overlay with camera icon */}
          {!uploading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
              initial={false}
            >
              <Camera size={32} className="text-white" />
            </motion.div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </motion.div>
    </div>
  )
}

