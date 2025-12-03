import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { useChatStore } from '@/store/chatStore'
import type { Profile } from '@/lib/services/profile.service'

interface ChatHeaderProps {
  selectedUser: Profile
  onBack?: () => void
  showBackButton?: boolean
}

export const ChatHeader = ({ selectedUser, onBack, showBackButton = false }: ChatHeaderProps) => {
  const { isUserOnline, getUserLastSeen } = useChatStore()
  const displayName =
    selectedUser.full_name || selectedUser.username || selectedUser.email || 'Unknown User'
  
  const isOnline = isUserOnline(selectedUser.id)
  const lastSeenFromStore = getUserLastSeen(selectedUser.id)
  const lastSeen = lastSeenFromStore || selectedUser.last_seen

  const getStatusText = () => {
    if (isOnline) {
      return <span className="text-sm text-green-600 font-medium">Active now</span>
    } else if (lastSeen) {
      try {
        const formatted = formatDistanceToNow(new Date(lastSeen), { addSuffix: true })
        return <span className="text-sm text-gray-500">Last seen {formatted}</span>
      } catch {
        return <span className="text-sm text-gray-500">Offline</span>
      }
    } else {
      return <span className="text-sm text-gray-500">Offline</span>
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-chat-header backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm"
    >
      <div className="flex items-center gap-4 px-4 py-3">
        {showBackButton && onBack && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="block md:hidden mr-4 cursor-pointer hover:text-primary"
            aria-label="Back to user list"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </motion.button>
        )}

        <Avatar profile={selectedUser} size="lg" isOnline={isOnline} />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{displayName}</h2>
          <div className="flex flex-col gap-0.5">
            {selectedUser.status && (
              <p className="text-sm text-gray-500 truncate">{selectedUser.status}</p>
            )}
            {getStatusText()}
          </div>
        </div>
      </div>
    </motion.header>
  )
}

