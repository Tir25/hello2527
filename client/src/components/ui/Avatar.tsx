import { useState, useEffect } from 'react'
import { type Profile } from '@/lib/services/profile.service'

interface AvatarProps {
  profile: Profile | null
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
}

export const Avatar = ({ profile, loading = false, size = 'md', className = '' }: AvatarProps) => {
  const sizeClass = sizeClasses[size]
  const [imageError, setImageError] = useState(false)

  // Get display name for initials
  const getDisplayName = () => {
    if (!profile) return 'U'
    return profile.full_name || profile.username || 'U'
  }

  // Generate initials (safe - only uses first letters, no HTML)
  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Reset image error when avatar URL changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setImageError(false)
    }
  }, [profile?.avatar_url])

  if (loading) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gray-200 animate-pulse border-2 border-white/50 shadow-md ${className}`}
      />
    )
  }

  // Show avatar image if available and no error, otherwise show initials
  const showImage = profile?.avatar_url && !imageError

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 border-2 border-white/50 shadow-md flex items-center justify-center bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-semibold ${className}`}
    >
      {showImage ? (
        <img
          src={profile.avatar_url ?? undefined}
          alt={getDisplayName()}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      ) : (
        getInitials()
      )}
    </div>
  )
}

