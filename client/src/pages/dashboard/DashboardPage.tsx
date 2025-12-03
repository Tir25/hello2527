import { motion } from 'framer-motion'
import { MessageSquare, Users, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleStartChatting = () => {
    navigate('/')
  }

  const handleFindFriends = () => {
    navigate('/')
  }

  const handleSearch = () => {
    navigate('/')
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
          Welcome back!
        </h1>
        <p className="text-gray-700 text-lg">
          {user?.email ? `Ready to chat, ${user.email.split('@')[0]}?` : 'Ready to start chatting?'}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl shadow-xl p-6 cursor-pointer hover:bg-white transition-colors"
          onClick={handleStartChatting}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleStartChatting()
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <MessageSquare className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold">Start Chatting</h3>
              <p className="text-gray-600 text-sm">Begin a conversation</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl shadow-xl p-6 cursor-pointer hover:bg-white transition-colors"
          onClick={handleFindFriends}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleFindFriends()
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold">Find Friends</h3>
              <p className="text-gray-600 text-sm">Discover new connections</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl shadow-xl p-6 cursor-pointer hover:bg-white transition-colors"
          onClick={handleSearch}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleSearch()
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <Search className="text-violet-400" size={24} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold">Search</h3>
              <p className="text-gray-600 text-sm">Find messages & users</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Highlights / Roadmap Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl shadow-xl p-6 sm:p-8 text-center"
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
          What you can do today
        </h2>
        <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
          Start real-time chats, discover new friends, and manage your profile with avatars and status updates.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm text-gray-700 mb-4">
          <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
            ✅ Real-time messaging
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            ✅ Global user search
          </span>
          <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
            ✅ Profiles & avatars
          </span>
        </div>
        <p className="text-gray-500 mb-4 text-sm">
          More chat features like typing indicators and message pagination are on the roadmap.
        </p>
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </div>
  )
}

