/**
 * BioSection Component
 * 
 * Responsibility: Display profile bio (name, username, status)
 * Layer: UI (Dumb Component)
 * 
 * Features:
 * - Clean username display (strips UUID suffixes)
 * - Private account indicator
 * - Bio/status display
 */

import { Lock } from 'lucide-react'
import { getDisplayUsername } from '@/lib/utils/string.utils'
import type { Profile } from '../../types/profile.types'

interface BioSectionProps {
  profile: Profile
  isPrivate: boolean
}

// Username utilities are now imported from @/lib/utils/string.utils

export const BioSection = ({ profile, isPrivate }: BioSectionProps) => {
  const displayUsername = getDisplayUsername(profile)

  return (
    <div className="mb-6 text-center">
      {/* Name with optional verified badge */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          {profile.full_name || displayUsername || 'User'}
        </h1>
        {/* Future: Add verified badge for verified users */}
        {/* {profile.is_verified && <Verified size={18} className="text-blue-500" />} */}
      </div>

      {/* Username */}
      {displayUsername && (
        <p className="text-sm text-gray-500 mb-2">@{displayUsername}</p>
      )}

      {/* Bio/Status */}
      {profile.status && (
        <p className="text-sm text-gray-600 mb-3 max-w-md mx-auto leading-relaxed">
          {profile.status}
        </p>
      )}

      {/* Private Account Indicator */}
      {isPrivate && (
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
          <Lock size={14} />
          <span className="text-xs font-medium">Private Account</span>
        </div>
      )}
    </div>
  )
}
