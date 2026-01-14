/**
 * Settings Page - Main Hub
 * Instagram-style settings with navigation to subpages
 * 
 * @module pages/settings/SettingsPage
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Camera,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

interface SettingItemProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle?: string
  onClick?: () => void
  danger?: boolean
  loading?: boolean
  disabled?: boolean
}

const SettingItem = ({ icon, iconBg, title, subtitle, onClick, danger, loading, disabled }: SettingItemProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading || disabled}
    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-colors touch-manipulation
      ${disabled
        ? 'opacity-50 cursor-not-allowed bg-gray-50 border border-gray-100'
        : danger
          ? 'bg-red-50 hover:bg-red-100 border border-red-100'
          : 'bg-white/80 hover:bg-gray-50 border border-gray-100'
      }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${disabled ? 'opacity-60' : ''} ${iconBg}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : danger ? 'text-red-700' : 'text-gray-900'}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}{disabled && ' (coming soon)'}
          </p>
        )}
      </div>
    </div>
    {loading ? (
      <Loader2 size={18} className={danger ? 'text-red-400 animate-spin' : 'text-gray-400 animate-spin'} />
    ) : (
      <ChevronRight size={18} className={disabled ? 'text-gray-300' : danger ? 'text-red-400' : 'text-gray-400'} />
    )}
  </button>
)

interface SettingSectionProps {
  title: string
  children: React.ReactNode
}

const SettingSection = ({ title, children }: SettingSectionProps) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
      {title}
    </h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
)

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, profile } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)

  // Logout handler
  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      const result = await logout()
      if (result?.success) {
        logger.info('SettingsPage:logout', 'Success')
        toast.success('Logged out successfully')
        navigate('/login')
      } else {
        toast.error(result?.error || 'Failed to log out')
      }
    } catch (error) {
      logger.error('SettingsPage:logout', 'Failed', error)
      toast.error('Failed to log out')
    } finally {
      setLoggingOut(false)
    }
  }, [logout, navigate])

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-6"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/80 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </motion.div>

        {/* Account Card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/profile')}
          className="w-full bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 rounded-2xl p-5 text-white shadow-lg text-left touch-manipulation"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-white/80" />
                )}
              </div>
              <div>
                <p className="font-bold text-lg">{profile?.username || 'User'}</p>
                <p className="text-white/80 text-sm">{user?.email}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/60" />
          </div>
        </motion.button>

        {/* Content & Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SettingSection title="Your content">
            <SettingItem
              icon={<Camera size={18} className="text-pink-600" />}
              iconBg="bg-pink-100"
              title="Story"
              subtitle="Close friends, replies, sharing"
              onClick={() => navigate('/settings/story')}
            />
            <SettingItem
              icon={<Shield size={18} className="text-blue-600" />}
              iconBg="bg-blue-100"
              title="Privacy"
              subtitle="Account privacy, search history"
              onClick={() => navigate('/settings/privacy')}
            />
            <SettingItem
              icon={<Bell size={18} className="text-orange-600" />}
              iconBg="bg-orange-100"
              title="Notifications"
              subtitle="Push, email, in-app notifications"
              disabled
            />
          </SettingSection>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <SettingSection title="Support">
            <SettingItem
              icon={<HelpCircle size={18} className="text-purple-600" />}
              iconBg="bg-purple-100"
              title="Help"
              subtitle="Help center, report a problem"
              disabled
            />
            <SettingItem
              icon={<Info size={18} className="text-gray-600" />}
              iconBg="bg-gray-100"
              title="About"
              subtitle="App info, terms, privacy policy"
              disabled
            />
          </SettingSection>
        </motion.div>

        {/* Login Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SettingSection title="Login">
            <SettingItem
              icon={<LogOut size={18} className="text-red-600" />}
              iconBg="bg-red-100"
              title={loggingOut ? 'Logging out...' : 'Log out'}
              onClick={handleLogout}
              danger
              loading={loggingOut}
            />
          </SettingSection>
        </motion.div>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-gray-400">Helo v1.0.0</p>
        </motion.div>
      </div>
    </div>
  )
}
