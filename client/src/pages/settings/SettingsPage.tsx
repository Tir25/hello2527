import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, LogOut, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user } = useAuthStore()

  const handleBack = () => {
    navigate(-1)
  }

  const handleEditProfile = () => {
    navigate('/profile')
  }

  const handleLogout = async () => {
    try {
      const result = await logout()

      if (result?.success) {
        logger.info('SettingsPage:logout', 'Logout successful')
        toast.success('Logged out successfully')
        navigate('/login')
      } else {
        logger.error('SettingsPage:logout', 'Logout failed', result?.error)
        toast.error(result?.error || 'Failed to log out')
      }
    } catch (error) {
      logger.error('SettingsPage:logout', 'Unexpected logout error', error)
      toast.error('Unexpected error during logout')
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/90 border border-white/60 rounded-2xl shadow-2xl px-6 py-6 sm:px-8 sm:py-8 text-gray-900"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          <h1 className="text-lg sm:text-xl font-semibold">Settings</h1>
          <div className="w-16" />
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">Signed in as</p>
          <p className="text-base font-medium text-gray-900 truncate">
            {user?.email || 'Unknown user'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleEditProfile}
            className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <User size={18} className="text-gray-700" />
              <span>Edit profile</span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-sm font-medium text-red-700"
          >
            <span className="flex items-center gap-2">
              <LogOut size={18} />
              <span>Log out</span>
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}


