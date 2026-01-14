/**
 * Privacy Settings Subpage
 * Privacy-related settings like search history, activity status, etc.
 * 
 * @module pages/settings/PrivacySettings
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ChevronLeft,
    History,
    Trash2,
    Eye,
    Lock,
    Loader2
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import { searchHistoryService, type PrivacySettings } from '@/lib/services/searchHistory'

interface SettingItemProps {
    icon: React.ReactNode
    iconBg: string
    title: string
    subtitle?: string
    onClick?: () => void
    rightElement?: React.ReactNode
    disabled?: boolean
}

const SettingItem = ({ icon, iconBg, title, subtitle, onClick, rightElement, disabled }: SettingItemProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-4 border border-gray-100 rounded-xl transition-colors touch-manipulation
            ${disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                : 'bg-white/80 hover:bg-gray-50'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${disabled ? 'opacity-60' : ''} ${iconBg}`}>
                {icon}
            </div>
            <div className="text-left">
                <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{title}</p>
                {subtitle && (
                    <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                        {subtitle}{disabled && ' (coming soon)'}
                    </p>
                )}
            </div>
        </div>
        {rightElement}
    </button>
)

interface ToggleSwitchProps {
    enabled: boolean
    loading?: boolean
    disabled?: boolean
}

const ToggleSwitch = ({ enabled, loading, disabled }: ToggleSwitchProps) => (
    <div className={`relative w-11 h-6 rounded-full transition-colors ${disabled ? 'opacity-50' : ''} ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}>
        <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ x: enabled ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={14} className="text-white animate-spin" />
            </div>
        )}
    </div>
)

export const PrivacySettingsPage = () => {
    const navigate = useNavigate()
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({ saveSearchHistory: true })
    const [savingHistory, setSavingHistory] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const result = await searchHistoryService.getPrivacySettings()
                if (result.data) {
                    setPrivacySettings(result.data)
                }
            } catch (error) {
                logger.error('PrivacySettings:load', 'Failed', error)
            }
        }
        loadSettings()
    }, [])

    // Toggle search history
    const handleToggleHistory = useCallback(async () => {
        const newValue = !privacySettings.saveSearchHistory
        setPrivacySettings({ saveSearchHistory: newValue })
        setSavingHistory(true)
        try {
            const result = await searchHistoryService.updatePrivacySettings(newValue)
            if (result.success) {
                toast.success(newValue ? 'Search history enabled' : 'Search history disabled')
            } else {
                setPrivacySettings({ saveSearchHistory: !newValue })
                toast.error('Failed to update setting')
            }
        } catch (error) {
            logger.error('PrivacySettings:toggle', 'Failed', error)
            setPrivacySettings({ saveSearchHistory: !newValue })
        } finally {
            setSavingHistory(false)
        }
    }, [privacySettings.saveSearchHistory])

    // Clear history
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
            logger.error('PrivacySettings:clear', 'Failed', error)
        } finally {
            setClearing(false)
        }
    }, [showClearConfirm])

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
                        onClick={() => navigate('/settings')}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/80 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors touch-manipulation"
                    >
                        <ChevronLeft size={22} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Privacy</h1>
                        <p className="text-sm text-gray-500">Control your account privacy</p>
                    </div>
                </motion.div>

                {/* Account Privacy Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-2"
                >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Account Privacy</h3>
                    <SettingItem
                        icon={<Lock size={18} className="text-blue-600" />}
                        iconBg="bg-blue-100"
                        title="Private Account"
                        subtitle="Only approved followers can see your posts"
                        rightElement={<ToggleSwitch enabled={false} disabled />}
                        disabled
                    />
                    <SettingItem
                        icon={<Eye size={18} className="text-indigo-600" />}
                        iconBg="bg-indigo-100"
                        title="Activity Status"
                        subtitle="Show when you're active"
                        rightElement={<ToggleSwitch enabled={true} disabled />}
                        disabled
                    />
                </motion.div>

                {/* Search & History Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Search & History</h3>
                    <SettingItem
                        icon={<History size={18} className="text-purple-600" />}
                        iconBg="bg-purple-100"
                        title="Save Search History"
                        subtitle="Sync searches across devices"
                        onClick={handleToggleHistory}
                        rightElement={<ToggleSwitch enabled={privacySettings.saveSearchHistory} loading={savingHistory} />}
                    />
                    <SettingItem
                        icon={<Trash2 size={18} className={showClearConfirm ? 'text-red-600' : 'text-gray-600'} />}
                        iconBg={showClearConfirm ? 'bg-red-100' : 'bg-gray-100'}
                        title={showClearConfirm ? 'Tap again to confirm' : 'Clear Search History'}
                        subtitle="Delete all saved searches"
                        onClick={handleClearHistory}
                        rightElement={clearing ? <Loader2 size={18} className="text-gray-400 animate-spin" /> : undefined}
                    />
                </motion.div>
            </div>
        </div>
    )
}
