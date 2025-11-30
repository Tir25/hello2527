import React, { type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, User, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import Button from '@/components/ui/Button'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, loading } = useAuthStore()

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (result.success) {
        logger.info('DashboardLayout:handleLogout', 'Logout successful')
        navigate('/login')
      } else {
        logger.error('DashboardLayout:handleLogout', 'Logout failed', result.error)
        // Still navigate to login even if logout fails
        navigate('/login')
      }
    } catch (error) {
      logger.error('DashboardLayout:handleLogout', 'Unexpected logout error', error)
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        {/* Subtle background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
        
        {/* Glass spinner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 backdrop-blur-xl bg-white/70 rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <div className="w-12 h-12 border-4 border-gray-200/50 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* Subtle background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.h1
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
              >
                He'loo
              </motion.h1>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-gray-700/80 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <MessageSquare size={20} />
                <span>Chat</span>
              </Link>
              <Link
                to="/profile"
                className="text-gray-700/80 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <User size={20} />
                <span>Profile</span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* User Email */}
              <span className="hidden sm:block text-gray-600 text-sm">
                {user?.email}
              </span>

              {/* Logout Button */}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-white/50"
                aria-label="Log out of your account"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-8 pb-16" role="main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}

