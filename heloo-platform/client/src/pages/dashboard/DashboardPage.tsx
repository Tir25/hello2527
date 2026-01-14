/**
 * Dashboard Page
 * Main dashboard with story feed and content
 * 
 * @module pages/dashboard/DashboardPage
 */

import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { StoryFeed } from '@/components/stories'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { useStoryStore } from '@/store/storyStore'

// Lazy load StoryViewer - only loads when viewer is opened
const StoryViewer = lazy(() => import('@/components/stories/StoryViewer').then(m => ({ default: m.StoryViewer })))

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isViewerOpen = useStoryStore((s) => s.viewer.isOpen)

  const handleStartChat = () => navigate('/chats')
  const handleFindFriends = () => navigate('/search')
  const handleActivity = () => navigate('/activity')

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Story Feed */}
      <StoryFeed />

      {/* Story Viewer (lazy loaded modal) */}
      {isViewerOpen && (
        <Suspense fallback={null}>
          <StoryViewer />
        </Suspense>
      )}

      {/* Welcome Section */}
      <motion.div
        className="px-4 py-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.email ? `Ready to chat, ${user.email.split('@')[0]}?` : 'Ready to start chatting?'}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <QuickActionCard
          icon="💬"
          title="Start Chatting"
          description="Jump into your conversations"
          onClick={handleStartChat}
          gradient="from-blue-500 to-indigo-600"
        />
        <QuickActionCard
          icon="🔍"
          title="Find Friends"
          description="Search for people to connect"
          onClick={handleFindFriends}
          gradient="from-purple-500 to-pink-600"
        />
        <QuickActionCard
          icon="🔔"
          title="Activity"
          description="See your notifications"
          onClick={handleActivity}
          gradient="from-orange-500 to-red-600"
        />
      </motion.div>
    </div>
  )
}

/** Quick action card component */
interface QuickActionCardProps {
  icon: string
  title: string
  description: string
  onClick: () => void
  gradient: string
}

function QuickActionCard({ icon, title, description, onClick, gradient }: QuickActionCardProps) {
  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-xl p-5 text-left
        bg-gradient-to-br ${gradient}
        shadow-lg hover:shadow-xl
        transition-shadow duration-200
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-3xl mb-3 block">{icon}</span>
      <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>

      {/* Decorative circle */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
    </motion.button>
  )
}
