/**
 * StatsRow Component
 * 
 * Responsibility: Display profile statistics (posts, followers, following)
 * Layer: UI (Dumb Component)
 * 
 * Features:
 * - Instagram-style horizontal layout
 * - Clickable followers/following to open modal
 * - Number formatting (1K, 1M)
 */

import { Calendar, Users, Image as ImageIcon, UserPlus } from 'lucide-react'
import { formatNumber } from '@/lib/utils/string.utils'
import type { ProfileStats } from '../../types/profile.types'

interface StatsRowProps {
  stats: ProfileStats
  isLoading?: boolean
  onFollowersClick?: () => void
  onFollowingClick?: () => void
}

interface StatItemProps {
  value: number
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

/**
 * Individual stat item with icon, value, and label
 */
const StatItem = ({ value, label, icon, onClick }: StatItemProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    aria-label={onClick ? `View ${formatNumber(value)} ${label}` : undefined}
    className={`
      flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/50 backdrop-blur-sm 
      transition-all duration-200
      ${onClick ? 'hover:bg-white/70 hover:shadow-md cursor-pointer active:scale-95' : 'cursor-default'}
    `}
  >
    <div className="flex items-center gap-1.5 text-gray-600 mb-0.5 sm:mb-1">
      {icon}
      <span className="text-lg sm:text-2xl font-bold text-gray-800">
        {formatNumber(value)}
      </span>
    </div>
    <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{label}</span>
  </button>
)

// formatNumber is now imported from shared utils

export const StatsRow = ({
  stats,
  isLoading = false,
  onFollowersClick,
  onFollowingClick,
}: StatsRowProps) => {
  const hasStats = stats.posts > 0 || stats.followers > 0 || stats.following > 0

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 text-center">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/30 animate-pulse">
            <div className="h-6 sm:h-8 w-12 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  // Stats with values or show joined date only
  if (hasStats || stats.joinedDate) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 text-center">
        {/* Posts - not clickable for now */}
        <StatItem
          value={stats.posts}
          label="Posts"
          icon={<ImageIcon size={14} className="text-gray-500" />}
        />

        {/* Followers - clickable */}
        <StatItem
          value={stats.followers}
          label="Followers"
          icon={<Users size={14} className="text-gray-500" />}
          onClick={onFollowersClick}
        />

        {/* Following - clickable */}
        <StatItem
          value={stats.following}
          label="Following"
          icon={<UserPlus size={14} className="text-gray-500" />}
          onClick={onFollowingClick}
        />
      </div>
    )
  }

  // Fallback: Just joined date
  if (stats.joinedDate) {
    return (
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center gap-1.5 text-gray-500 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm">
          <Calendar size={14} />
          <span className="text-xs sm:text-sm">Member since {stats.joinedDate}</span>
        </div>
      </div>
    )
  }

  return null
}
