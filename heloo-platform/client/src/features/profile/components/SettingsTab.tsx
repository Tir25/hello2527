/**
 * SettingsTab Component
 * 
 * Responsibility: Display settings controls for own profile
 * Layer: UI Component (Presentational)
 * 
 * Features:
 * - Privacy settings (search history toggle)
 * - Clear history functionality
 * - Logout button
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, History, Trash2, Shield, Loader2, Users, ChevronRight } from 'lucide-react'
import { searchHistoryService, type PrivacySettings } from '@/lib/services/searchHistory'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import { CloseFriendsManager } from '@/components/stories/editor/CloseFriendsManager'

export const SettingsTab = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { user } = useAuthStore()
    const [settings, setSettings] = useState<PrivacySettings>({ saveSearchHistory: true })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [isCloseFriendsOpen, setIsCloseFriendsOpen] = useState(false)

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true)
                const result = await searchHistoryService.getPrivacySettings()
                if (result.data) {
                    setSettings(result.data)
                }
            } catch (error) {
                logger.error('SettingsTab:loadSettings', 'Failed to load', error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    // Toggle search history setting
    const handleToggle = useCallback(async () => {
        const newValue = !settings.saveSearchHistory
        setSettings({ saveSearchHistory: newValue })
        setSaving(true)

        try {
            const result = await searchHistoryService.updatePrivacySettings(newValue)
            if (result.success) {
                toast.success(newValue ? 'Search history enabled' : 'Search history disabled')
            } else {
                setSettings({ saveSearchHistory: !newValue })
                toast.error('Failed to update setting')
            }
        } catch (error) {
            logger.error('SettingsTab:handleToggle', 'Failed', error)
            setSettings({ saveSearchHistory: !newValue })
            toast.error('Failed to update setting')
        } finally {
            setSaving(false)
        }
    }, [settings.saveSearchHistory])

    // Clear all history
    const handleClearHistory = useCallback(async () => {
        if (!showClearConfirm) {
            setShowClearConfirm(true)
            setTimeout(() => setShowClearConfirm(false), 3000)
            return
        }

        setClearing(true)
        setShowClearConfirm(false)

        try {
            const result = await searchHistoryService.clearSearchHistory()
            if (result.success) {
                toast.success('Search history cleared')
            } else {
                toast.error('Failed to clear history')
            }
        } catch (error) {
            logger.error('SettingsTab:handleClearHistory', 'Failed', error)
            toast.error('Failed to clear history')
        } finally {
            setClearing(false)
        }
    }, [showClearConfirm])

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            setLoggingOut(true)
            const result = await logout()

            if (result?.success) {
                logger.info('SettingsTab:logout', 'Logout successful')
                toast.success('Logged out successfully')
                navigate('/login')
            } else {
                logger.error('SettingsTab:logout', 'Logout failed', result?.error)
                toast.error(result?.error || 'Failed to log out')
            }
        } catch (error) {
            logger.error('SettingsTab:logout', 'Unexpected logout error', error)
            toast.error('Unexpected error during logout')
        } finally {
            setLoggingOut(false)
        }
    }, [logout, navigate])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-gray-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Account Info */}
            <div className="pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-600">Signed in as</p>
                <p className="text-base font-medium text-gray-900 truncate">
                    {user?.email || 'Unknown user'}
                </p>
            </div>

            {/* Stories Section - Close Friends */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500">
                    <Users size={16} />
                    <span className="text-sm font-medium">Stories</span>
                </div>

                <button
                    type="button"
                    onClick={() => setIsCloseFriendsOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50">
                            <Users size={18} className="text-green-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">Close Friends</p>
                            <p className="text-xs text-gray-500">Manage your close friends list</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>
            </div>

            {/* Privacy Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500">
                    <Shield size={16} />
                    <span className="text-sm font-medium">Privacy</span>
                </div>

                {/* Toggle Setting */}
                <motion.button
                    type="button"
                    onClick={handleToggle}
                    disabled={saving}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <History size={18} className="text-purple-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">Save search history</p>
                            <p className="text-xs text-gray-500">Sync searches across devices</p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <div
                        className={`relative w-11 h-6 rounded-full transition-colors ${settings.saveSearchHistory ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                        <motion.div
                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                            animate={{ x: settings.saveSearchHistory ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                        {saving && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 size={14} className="text-white animate-spin" />
                            </div>
                        )}
                    </div>
                </motion.button>

                {/* Clear History Button */}
                <motion.button
                    type="button"
                    onClick={handleClearHistory}
                    disabled={clearing}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${showClearConfirm
                        ? 'border-red-200 bg-red-50 hover:bg-red-100'
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50'
                        } disabled:opacity-50`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${showClearConfirm ? 'bg-red-100' : 'bg-gray-100'}`}>
                            <Trash2 size={18} className={showClearConfirm ? 'text-red-600' : 'text-gray-600'} />
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-medium ${showClearConfirm ? 'text-red-700' : 'text-gray-900'}`}>
                                {showClearConfirm ? 'Tap again to confirm' : 'Clear search history'}
                            </p>
                            <p className="text-xs text-gray-500">Delete all saved searches</p>
                        </div>
                    </div>

                    {clearing && <Loader2 size={18} className="text-gray-400 animate-spin" />}
                </motion.button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Logout Button */}
            <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-sm font-medium text-red-700 disabled:opacity-50"
            >
                <span className="flex items-center gap-2">
                    <LogOut size={18} />
                    <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
                </span>
                {loggingOut && <Loader2 size={18} className="animate-spin" />}
            </button>

            {/* Close Friends Manager Modal */}
            <CloseFriendsManager
                isOpen={isCloseFriendsOpen}
                onClose={() => setIsCloseFriendsOpen(false)}
            />
        </div>
    )
}
