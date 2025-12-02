import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/lib/services/profile.service'

interface ChatHeaderProps {
  selectedUser: Profile
  onBack?: () => void
  showBackButton?: boolean
}

export const ChatHeader = ({ selectedUser, onBack, showBackButton = false }: ChatHeaderProps) => {
  const displayName =
    selectedUser.full_name || selectedUser.username || selectedUser.email || 'Unknown User'

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

        <Avatar profile={selectedUser} size="md" />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{displayName}</h2>
          {selectedUser.status && (
            <p className="text-sm text-gray-500 truncate">{selectedUser.status}</p>
          )}
        </div>
      </div>
    </motion.header>
  )
}

