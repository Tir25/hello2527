/**
 * AvatarSection Component
 * 
 * Responsibility: Display profile avatar with online status and premium styling
 * Layer: UI (Dumb Component)
 * 
 * Features:
 * - Premium gradient ring effect
 * - Online status indicator
 */

import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '../../types/profile.types'

interface AvatarSectionProps {
  profile: Profile
  isOnline: boolean
  isOwnProfile: boolean
}

export const AvatarSection = ({ profile, isOnline, isOwnProfile }: AvatarSectionProps) => {
  return (
    <div className="flex flex-col items-center mb-6">
      {/* Avatar Container with Gradient Ring */}
      <div className="relative group">
        {/* Gradient Ring Background - uses padding instead of ring class */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

        {/* White padding layer - fully rounded */}
        <div className="relative rounded-full p-[3px] bg-white">
          <Avatar
            profile={profile}
            size="xl"
            isOnline={isOnline && !isOwnProfile}
          />
        </div>
      </div>
    </div>
  )
}
