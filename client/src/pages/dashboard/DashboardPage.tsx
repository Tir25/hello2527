import { motion } from 'framer-motion'
import { MessageSquare, Users, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export const DashboardPage = () => {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent">
          Welcome back!
        </h1>
        <p className="text-white/80 text-lg">
          {user?.email ? `Ready to chat, ${user.email.split('@')[0]}?` : 'Ready to start chatting?'}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 cursor-pointer hover:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <MessageSquare className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Start Chatting</h3>
              <p className="text-white/60 text-sm">Begin a conversation</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 cursor-pointer hover:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Find Friends</h3>
              <p className="text-white/60 text-sm">Discover new connections</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 cursor-pointer hover:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <Search className="text-violet-400" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Search</h3>
              <p className="text-white/60 text-sm">Find messages & users</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Coming Soon Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8 text-center"
      >
        <p className="text-white/60 mb-4">Chat features coming soon...</p>
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </div>
  )
}

