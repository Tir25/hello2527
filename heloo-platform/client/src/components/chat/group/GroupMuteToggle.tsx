/**
 * GroupMuteToggle Component
 * 
 * Toggle switch for muting/unmuting group notifications.
 * Shows mute duration options when muting.
 * 
 * Responsibility: Group notification mute control
 */

import { useState, useCallback } from 'react'
import { BellOff, Bell, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { groupService } from '@/lib/services/group.service'
import { toast } from '@/store/toastStore'
import { triggerHaptic } from '@/hooks/useIsMobileUI'
import { cn } from '@/utils/cn'

interface GroupMuteToggleProps {
    groupId: string
    mutedUntil: string | null
    onMuteChange: (mutedUntil: string | null) => void
    className?: string
}

type MuteDuration = '1h' | '8h' | '24h' | '7d' | 'forever'

const MUTE_OPTIONS: { value: MuteDuration; label: string }[] = [
    { value: '1h', label: '1 hour' },
    { value: '8h', label: '8 hours' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: 'forever', label: 'Until I turn it back on' },
]

const getMuteUntil = (duration: MuteDuration): string | null => {
    const now = new Date()
    switch (duration) {
        case '1h': return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
        case '8h': return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString()
        case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        case 'forever': return new Date('2099-12-31').toISOString()
        default: return null
    }
}

export const GroupMuteToggle = ({
    groupId,
    mutedUntil,
    onMuteChange,
    className,
}: GroupMuteToggleProps) => {
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const isMuted = mutedUntil && new Date(mutedUntil) > new Date()

    const handleUnmute = useCallback(async () => {
        triggerHaptic('light')
        setLoading(true)

        const result = await groupService.toggleMute(groupId, null)

        if (result.success) {
            onMuteChange(null)
            toast.success('Notifications unmuted')
        } else {
            toast.error(result.error || 'Failed to unmute')
        }

        setLoading(false)
    }, [groupId, onMuteChange])

    const handleMute = useCallback(async (duration: MuteDuration) => {
        triggerHaptic('light')
        setLoading(true)
        setShowOptions(false)

        const until = getMuteUntil(duration)
        const result = await groupService.toggleMute(groupId, until)

        if (result.success) {
            onMuteChange(until)
            toast.success('Notifications muted')
        } else {
            toast.error(result.error || 'Failed to mute')
        }

        setLoading(false)
    }, [groupId, onMuteChange])

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={isMuted ? handleUnmute : () => setShowOptions(!showOptions)}
                disabled={loading}
                className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl transition-all",
                    "hover:bg-gray-50 active:scale-[0.98]",
                    isMuted ? "bg-orange-50" : "bg-gray-50",
                    "disabled:opacity-50"
                )}
            >
                <div className="flex items-center gap-3">
                    {isMuted ? (
                        <BellOff className="w-5 h-5 text-orange-500" />
                    ) : (
                        <Bell className="w-5 h-5 text-gray-500" />
                    )}
                    <div className="text-left">
                        <p className="font-medium text-gray-900">
                            {isMuted ? 'Notifications muted' : 'Mute notifications'}
                        </p>
                        {isMuted && (
                            <p className="text-sm text-gray-500">
                                Tap to unmute
                            </p>
                        )}
                    </div>
                </div>
                {loading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : !isMuted && (
                    <ChevronDown className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        showOptions && "rotate-180"
                    )} />
                )}
            </button>

            {/* Mute duration options */}
            <AnimatePresence>
                {showOptions && !isMuted && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-1 pl-12">
                            {MUTE_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleMute(option.value)}
                                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm
                                              text-gray-700 hover:bg-gray-100 active:scale-[0.98]
                                              transition-all"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
