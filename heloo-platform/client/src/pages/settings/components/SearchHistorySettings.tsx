/**
 * Search History Settings Component
 * 
 * Responsibility: Privacy settings for search history
 * Layer: UI Component (Presentational)
 * 
 * Features:
 * - Toggle to enable/disable search history saving
 * - Clear all history button
 * - Visual feedback for settings changes
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { History, Trash2, Shield, Loader2 } from 'lucide-react'
import { searchHistoryService, type PrivacySettings } from '@/lib/services/searchHistory'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'

export const SearchHistorySettings = () => {
    const [settings, setSettings] = useState<PrivacySettings>({ saveSearchHistory: true })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

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
                logger.error('SearchHistorySettings:loadSettings', 'Failed to load', error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    // Toggle search history setting
    const handleToggle = useCallback(async () => {
        const newValue = !settings.saveSearchHistory

        // Optimistic update
        setSettings({ saveSearchHistory: newValue })
        setSaving(true)

        try {
            const result = await searchHistoryService.updatePrivacySettings(newValue)
            if (result.success) {
                toast.success(newValue ? 'Search history enabled' : 'Search history disabled')
            } else {
                // Revert on failure
                setSettings({ saveSearchHistory: !newValue })
                toast.error('Failed to update setting')
            }
        } catch (error) {
            logger.error('SearchHistorySettings:handleToggle', 'Failed', error)
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
            logger.error('SearchHistorySettings:handleClearHistory', 'Failed', error)
            toast.error('Failed to clear history')
        } finally {
            setClearing(false)
        }
    }, [showClearConfirm])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="text-gray-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center gap-2 text-gray-500">
                <Shield size={16} />
                <span className="text-sm font-medium">Privacy</span>
            </div>

            {/* Toggle Setting */}
            <motion.button
                type="button"
                onClick={handleToggle}
                disabled={saving}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-white/50 hover:bg-white/80 transition-colors disabled:opacity-50"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                        <History size={18} className="text-purple-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                            Save search history
                        </p>
                        <p className="text-xs text-gray-500">
                            Sync searches across devices
                        </p>
                    </div>
                </div>

                {/* Toggle Switch */}
                <div
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings.saveSearchHistory ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                >
                    <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                        animate={{
                            x: settings.saveSearchHistory ? 20 : 0,
                        }}
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
                    : 'border-gray-100 bg-white/50 hover:bg-white/80'
                    } disabled:opacity-50`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${showClearConfirm ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <Trash2
                            size={18}
                            className={showClearConfirm ? 'text-red-600' : 'text-gray-600'}
                        />
                    </div>
                    <div className="text-left">
                        <p className={`text-sm font-medium ${showClearConfirm ? 'text-red-700' : 'text-gray-900'}`}>
                            {showClearConfirm ? 'Tap again to confirm' : 'Clear search history'}
                        </p>
                        <p className="text-xs text-gray-500">
                            Delete all saved searches
                        </p>
                    </div>
                </div>

                {clearing && (
                    <Loader2 size={18} className="text-gray-400 animate-spin" />
                )}
            </motion.button>
        </div>
    )
}
