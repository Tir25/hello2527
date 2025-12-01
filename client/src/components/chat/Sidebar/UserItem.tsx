import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import type { Profile } from '@/lib/services/profile.service'

interface UserItemProps {
  user: Profile
  isSelected: boolean
  onClick: () => void
  // Optional conversation metadata
  lastMessage?: string | null
  lastMessageTime?: string | null
  unreadCount?: number
}

/**
 * Formats a timestamp into a human-readable relative time
 */
const formatMessageTime = (timestamp: string | null | undefined): string => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  // For older messages, show the date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const UserItem = ({ 
  user, 
  isSelected, 
  onClick,
  lastMessage,
  lastMessageTime,
  unreadCount = 0
}: UserItemProps) => {
  // Get display name: full_name > username > email prefix > 'User'
  const displayName =
    user.full_name || user.username || user.email?.split('@')[0] || 'User'

  // Show last message if available, otherwise show status
  const subtitle = lastMessage 
    ? lastMessage 
    : (user.status || "Hey there! I am using He'loo")
  
  const hasUnread = unreadCount > 0
  const timeDisplay = formatMessageTime(lastMessageTime)

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
      <div className="relative">
        <Avatar profile={user} size="md" />
        {/* Online indicator could go here */}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-sm font-semibold text-gray-800 truncate',
            hasUnread && 'text-gray-900'
          )}>
            {displayName}
          </p>
          {timeDisplay && (
            <span className={cn(
              'text-[10px] flex-shrink-0',
              hasUnread ? 'text-purple-600 font-medium' : 'text-gray-400'
            )}>
              {timeDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-xs truncate',
            hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
          )}>
            {subtitle}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
