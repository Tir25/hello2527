import { useState, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
import { type Profile } from '@/lib/services/profile.service'
import { cn } from '@/utils/cn'

interface AvatarProps {
  profile: Profile | null
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isOnline?: boolean
  className?: string
  /** Enable native lazy loading (default: true) */
  lazy?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
}

const glowSizeClasses = {
  sm: 'inset-[-2px]',
  md: 'inset-[-3px]',
  lg: 'inset-[-4px]',
  xl: 'inset-[-6px]',
}

export const Avatar = ({
  profile,
  loading = false,
  size = 'md',
  isOnline = false,
  className = '',
  lazy = true,
}: AvatarProps) => {
  const sizeClass = sizeClasses[size]
  const glowSizeClass = glowSizeClasses[size]
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Performance: Disable expensive glow animation for reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Get display name for initials
  const getDisplayName = () => {
    if (!profile) return 'U'
    return profile.full_name || profile.username || profile.email?.split('@')[0] || 'U'
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

  // Reset image states when avatar URL changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setImageError(false)
      setImageLoaded(false)
    }
  }, [profile?.avatar_url])

  if (loading) {
    return (
      <div
        className={cn(
          sizeClass,
          'rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse border-2 border-white/50 shadow-md relative overflow-hidden',
          className
        )}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
    )
  }

  // Show avatar image if available and no error, otherwise show initials
  const showImage = profile?.avatar_url && !imageError

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {/* Aurora Glow Layer - Only visible when online AND reduced motion not preferred */}
      {isOnline && !prefersReducedMotion && (
        <div
          className={cn(
            'absolute rounded-full blur-[2px]',
            glowSizeClass,
            'animate-spin-slow opacity-80',
            'z-0'
          )}
          style={{
            background: 'conic-gradient(from 0deg, #22c55e, #a855f7, #3b82f6, #ec4899, #22c55e)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Avatar Container */}
      <div
        className={cn(
          sizeClass,
          'rounded-full overflow-hidden flex-shrink-0',
          'border-2 border-white shadow-md',
          'flex items-center justify-center',
          'bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500',
          'text-white font-semibold',
          'relative z-10',
          isOnline && 'ring-2 ring-green-400/30'
        )}
      >
        {showImage ? (
          <>
            {/* Loading placeholder - shown while image loads */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500">
                <span className="select-none">{getInitials()}</span>
                {/* Subtle shimmer overlay */}
                <div className="absolute inset-0 skeleton-shimmer opacity-50" />
              </div>
            )}
            <img
              src={profile.avatar_url ?? undefined}
              alt={getDisplayName()}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading={lazy ? 'lazy' : 'eager'}
              decoding="async"
              onError={() => {
                setImageError(true)
                setImageLoaded(false)
              }}
              onLoad={() => {
                setImageError(false)
                setImageLoaded(true)
              }}
            />
          </>
        ) : (
          <span className="select-none">{getInitials()}</span>
        )}
      </div>

      {/* Online indicator dot - ALWAYS visible when online (works on all devices) */}
      {isOnline && (
        <div
          className={cn(
            'absolute z-20 rounded-full bg-green-500 border-2 border-white shadow-sm',
            size === 'sm' && 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
            size === 'md' && 'w-3 h-3 bottom-0 right-0',
            size === 'lg' && 'w-3.5 h-3.5 bottom-0.5 right-0.5',
            size === 'xl' && 'w-4 h-4 bottom-1 right-1'
          )}
          aria-label="Online"
        />
      )}
    </div>
  )
}
