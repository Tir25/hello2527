import { useState, useRef, useCallback, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { User, Camera } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from '@/store/toastStore'

interface AvatarUploadProps {
  avatarUrl: string | null
  onFileSelect: (file: File) => void
  uploading?: boolean
  className?: string
}

export const AvatarUpload = ({
  avatarUrl,
  onFileSelect,
  uploading = false,
  className,
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

  const displayUrl = previewUrl || avatarUrl

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
        {/* Large circular glass container */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden">
          {/* Glass effect background */}
          <div className="absolute inset-0 backdrop-blur-xl bg-white/10 border-4 border-white/20 rounded-full shadow-2xl" />

          {/* Avatar Image or Placeholder */}
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="absolute inset-0 w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-full">
              <User size={64} className="text-white/60" />
            </div>
          )}

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Hover overlay with camera icon */}
          {!uploading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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

