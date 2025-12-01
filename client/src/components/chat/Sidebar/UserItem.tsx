import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import type { Profile } from '@/lib/services/profile.service'

interface UserItemProps {
  user: Profile
  isSelected: boolean
  onClick: () => void
}

export const UserItem = ({ user, isSelected, onClick }: UserItemProps) => {
  // Get display name: full_name > username > email prefix > 'User'
  const displayName =
    user.full_name || user.username || user.email?.split('@')[0] || 'User'

  // Get status or default message
  const status = user.status || "Hey there! I am using He'loo"

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl cursor-pointer',
        'transition-all duration-200',
        isSelected
          ? // Active Glass style - more opaque and highlighted
            'bg-white/70 backdrop-blur-lg shadow-lg border-2 border-purple-300/40 ring-2 ring-purple-200/30'
          : // Default state with hover effects
            'bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/50 hover:shadow-md hover:border-white/30'
      )}
      whileHover={isSelected ? { scale: 1.01 } : { scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <Avatar profile={user} size="md" />

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
        <p className="text-xs text-gray-600 truncate">{status}</p>
      </div>
    </motion.div>
  )
}

