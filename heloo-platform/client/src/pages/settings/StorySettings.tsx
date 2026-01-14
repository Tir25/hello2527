/**
 * Story Settings Subpage
 * Story-related settings like close friends, sharing, replies
 * 
 * @module pages/settings/StorySettings
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ChevronLeft,
    ChevronRight,
    Users,
    MessageCircle,
    Eye,
    Download,
    Share2
} from 'lucide-react'
import { CloseFriendsManager } from '@/components/stories/editor/CloseFriendsManager'

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
        {rightElement || <ChevronRight size={18} className={disabled ? 'text-gray-300' : 'text-gray-400'} />}
    </button>
)

interface ToggleSwitchProps {
    enabled: boolean
    disabled?: boolean
}

const ToggleSwitch = ({ enabled, disabled }: ToggleSwitchProps) => (
    <div className={`relative w-11 h-6 rounded-full transition-colors ${disabled ? 'opacity-50' : ''} ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}>
        <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ x: enabled ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
    </div>
)

export const StorySettingsPage = () => {
    const navigate = useNavigate()
    const [isCloseFriendsOpen, setIsCloseFriendsOpen] = useState(false)

    // Placeholder states for future settings (read-only for now)
    const allowReplies = true
    const saveToGallery = false
    const allowSharing = true

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
                        <h1 className="text-2xl font-bold text-gray-900">Story</h1>
                        <p className="text-sm text-gray-500">Manage your story settings</p>
                    </div>
                </motion.div>

                {/* Audience Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-2"
                >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Audience</h3>
                    <SettingItem
                        icon={<Users size={18} className="text-green-600" />}
                        iconBg="bg-green-100"
                        title="Close Friends"
                        subtitle="Manage your close friends list"
                        onClick={() => setIsCloseFriendsOpen(true)}
                    />
                    <SettingItem
                        icon={<Eye size={18} className="text-blue-600" />}
                        iconBg="bg-blue-100"
                        title="Hide Story From"
                        subtitle="Choose who can't see your story"
                        disabled
                    />
                </motion.div>

                {/* Interactions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Interactions</h3>
                    <SettingItem
                        icon={<MessageCircle size={18} className="text-purple-600" />}
                        iconBg="bg-purple-100"
                        title="Allow Replies"
                        subtitle="Let people reply to your stories"
                        rightElement={<ToggleSwitch enabled={allowReplies} />}
                        disabled
                    />
                    <SettingItem
                        icon={<Share2 size={18} className="text-cyan-600" />}
                        iconBg="bg-cyan-100"
                        title="Allow Sharing"
                        subtitle="Let people share your stories"
                        rightElement={<ToggleSwitch enabled={allowSharing} />}
                        disabled
                    />
                </motion.div>

                {/* Saving Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Saving</h3>
                    <SettingItem
                        icon={<Download size={18} className="text-orange-600" />}
                        iconBg="bg-orange-100"
                        title="Save to Gallery"
                        subtitle="Automatically save stories to your phone"
                        rightElement={<ToggleSwitch enabled={saveToGallery} />}
                        disabled
                    />
                </motion.div>

                {/* Info */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs text-gray-400 text-center px-4"
                >
                    Stories disappear after 24 hours unless saved to your highlights
                </motion.p>
            </div>

            {/* Close Friends Manager Modal */}
            <CloseFriendsManager
                isOpen={isCloseFriendsOpen}
                onClose={() => setIsCloseFriendsOpen(false)}
            />
        </div>
    )
}
