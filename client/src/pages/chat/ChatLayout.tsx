import React, { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'
import Button from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

interface ChatLayoutProps {
  children: ReactNode
}

export const ChatLayout = ({ children }: ChatLayoutProps) => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, profile, profileLoading, profileError } = useAuthStore()

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (result.success) {
        logger.info('ChatLayout:handleLogout', 'Logout successful')
        navigate('/login')
      } else {
        logger.error('ChatLayout:handleLogout', 'Logout failed', result.error)
        // Still navigate to login even if logout fails
        navigate('/login')
      }
    } catch (error) {
      logger.error('ChatLayout:handleLogout', 'Unexpected logout error', error)
      navigate('/login')
    }
  }

  // Get display name: profile full_name > profile username > user email (with proper fallback)
  const displayName =
    profile?.full_name || 
    profile?.username || 
    (user?.email?.split('@')[0]?.trim() || null) || 
    'User'

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* Subtle background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Left Pane - Sidebar */}
      <aside className="w-[400px] flex-shrink-0 backdrop-blur-xl bg-white/70 border-r border-white/20 flex flex-col shadow-lg">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
            >
              He'loo
            </motion.h1>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900 hover:bg-white/50"
              aria-label="Log out of your account"
            >
              <LogOut size={18} />
            </Button>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30">
            <Avatar profile={profile} loading={profileLoading} size="md" />
            <div className="flex-1 min-w-0">
              {profileLoading ? (
                <>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  {profileError && (
                    <p className="text-xs text-red-500 mt-1 truncate" title={profileError}>
                      Profile error
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content - Placeholder for future chat list */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Future: Chat list will go here */}
        </div>
      </aside>

      {/* Right Pane - Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden" role="main">
        {children}
      </main>
    </div>
  )
}

