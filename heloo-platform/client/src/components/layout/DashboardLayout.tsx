import { type ReactNode, lazy, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, MessageSquare, LayoutDashboard, Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useGlobalMessageListener } from '@/hooks/useGlobalMessageListener'
import { useSettingsInit } from '@/hooks/useSettingsInit'
import { useStoryStore } from '@/store/storyStore'

// Lazy load StoryViewer for performance
const StoryViewer = lazy(() => import('@/components/stories/StoryViewer').then(m => ({ default: m.StoryViewer })))

interface DashboardLayoutProps {
  children: ReactNode
}

interface NavIconProps {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  active?: boolean
}

const NavIcon = ({ to, label, icon: Icon, active }: NavIconProps) => {
  return (
    <Link
      to={to}
      className="group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
      aria-label={label}
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200 border ${active
          ? 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 border-white/70 scale-105'
          : 'bg-white/80 border-white/50 hover:bg-white'
          }`}
      >
        <Icon
          size={20}
          className={active ? 'text-white' : 'text-gray-700'}
        />
      </div>
      <p className="mt-1 text-[11px] text-center text-gray-600 group-hover:text-gray-800">
        {label}
      </p>
    </Link>
  )
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { loading } = useAuthStore()
  const location = useLocation()

  // CRITICAL: Mount global message listener for real-time updates
  // This hook handles all Supabase Realtime subscriptions for messages
  useGlobalMessageListener()

  // Initialize conversation settings (muted, deleted, archived) for filtering
  useSettingsInit()

  const isChatRoute = location.pathname === '/'
  const isDashboardRoute = location.pathname === '/dashboard'
  const isActivityRoute = location.pathname === '/activity'
  const isSearchRoute = location.pathname === '/search'
  const isProfileRoute = location.pathname === '/profile'

  // Story viewer state - render globally for DM story mentions
  const isViewerOpen = useStoryStore(s => s.viewer.isOpen)

  if (loading) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        {/* Subtle background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Glass spinner - reduced blur */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 backdrop-blur-md bg-white/80 rounded-2xl p-8 border border-white/30 shadow-xl"
        >
          <div className="w-12 h-12 border-4 border-gray-200/50 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden flex flex-col">
      {/* Subtle background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar (hidden for full-height chat view) */}
      {/* Top navigation removed per user request */}

      {/* Main Content - rigid frame, no page scrolling */}
      <main className="relative z-10 flex-1 overflow-hidden" role="main">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
          {/* Desktop side navigation - reduced blur */}
          <aside className="hidden md:flex w-20 flex-col items-center justify-between py-6 mr-6 rounded-3xl bg-white/90 border border-white/50 backdrop-blur-lg shadow-xl">
            <div className="flex flex-col items-center gap-4">
              {/* App logo mini */}
              <Link to="/" className="mb-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center text-xs font-semibold text-white shadow-lg"
                >
                  He
                </motion.div>
              </Link>

              {/* Nav icons */}
              <NavIcon
                to="/"
                active={isChatRoute}
                label="Chat"
                icon={MessageSquare}
              />
              <NavIcon
                to="/dashboard"
                active={isDashboardRoute}
                label="Home"
                icon={LayoutDashboard}
              />
              <NavIcon
                to="/search"
                active={isSearchRoute}
                label="Search"
                icon={Search}
              />
              <NavIcon
                to="/activity"
                active={isActivityRoute}
                label="Activity"
                icon={Bell}
              />
              <NavIcon
                to="/profile"
                active={isProfileRoute}
                label="Profile"
                icon={User}
              />
            </div>
          </aside>

          {/* Page content */}
          <div className="flex-1 h-full overflow-hidden">
            {children}
          </div>
        </div>
      </main>

      {/* Global Story Viewer - rendered on all pages for DM story mentions */}
      {isViewerOpen && (
        <Suspense fallback={null}>
          <StoryViewer />
        </Suspense>
      )}
    </div>
  )
}

