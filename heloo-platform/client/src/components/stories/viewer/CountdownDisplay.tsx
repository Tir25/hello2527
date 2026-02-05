/**
 * Countdown Display Component
 * Renders live countdown timer for story viewer
 *
 * @module components/stories/viewer/CountdownDisplay
 */

import { memo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, Bell, BellOff, PartyPopper } from 'lucide-react'
import { subscribeToReminder, unsubscribeFromReminder, isSubscribed } from '@/services/stories/countdownService'

interface CountdownDisplayProps {
    storyId: string
    stickerId: string
    data: string
    x: number
    y: number
}

interface CountdownData {
    title: string
    endDate: string
}

/**
 * Live countdown timer display with "Remind Me" functionality
 */
export const CountdownDisplay = memo(function CountdownDisplay({
    storyId,
    stickerId,
    data,
    x,
    y
}: CountdownDisplayProps) {
    const [timeLeft, setTimeLeft] = useState<string>('--:--:--:--')
    const [isEnded, setIsEnded] = useState(false)
    const [reminded, setReminded] = useState(false)
    const [isTogglingReminder, setIsTogglingReminder] = useState(false)

    // Parse countdown data
    const countdownData = parseCountdownData(data)

    // Check initial reminder status
    useEffect(() => {
        let mounted = true
        isSubscribed(storyId, stickerId).then(subscribed => {
            if (mounted) setReminded(subscribed)
        })
        return () => { mounted = false }
    }, [storyId, stickerId])

    // Live timer update
    useEffect(() => {
        if (!countdownData?.endDate) return

        const updateTimer = () => {
            const now = new Date()
            const end = new Date(countdownData.endDate)
            const diff = end.getTime() - now.getTime()

            if (diff <= 0) {
                setIsEnded(true)
                setTimeLeft('00:00:00:00')
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(
                `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [countdownData?.endDate])

    const handleReminderToggle = useCallback(async () => {
        if (isTogglingReminder) return
        setIsTogglingReminder(true)

        try {
            if (reminded) {
                await unsubscribeFromReminder(storyId, stickerId)
                setReminded(false)
            } else {
                await subscribeToReminder(storyId, stickerId)
                setReminded(true)
            }
        } catch (error) {
            console.error('Failed to toggle reminder:', error)
        } finally {
            setIsTogglingReminder(false)
        }
    }, [storyId, stickerId, reminded, isTogglingReminder])

    if (!countdownData) return null

    return (
        <div
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-orange-500/90 to-amber-600/90 backdrop-blur-md 
                    rounded-2xl p-4 shadow-2xl min-w-[200px] max-w-[280px]"
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-white" />
                    <h3 className="text-white font-bold text-sm truncate flex-1">
                        {countdownData.title}
                    </h3>
                </div>

                {/* Timer or Ended State */}
                {isEnded ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                        <PartyPopper className="w-6 h-6 text-white" />
                        <span className="text-white font-bold text-lg">Ended!</span>
                    </div>
                ) : (
                    <>
                        {/* Time Display */}
                        <div className="text-white text-2xl font-mono text-center py-2">
                            {timeLeft}
                        </div>
                        <div className="flex justify-center gap-4 text-white/60 text-[10px] uppercase">
                            <span>Days</span>
                            <span>Hrs</span>
                            <span>Min</span>
                            <span>Sec</span>
                        </div>

                        {/* Remind Me Button */}
                        <button
                            onClick={handleReminderToggle}
                            disabled={isTogglingReminder}
                            className={`w-full mt-3 flex items-center justify-center gap-2 min-h-[40px] py-2 
                                rounded-xl font-medium text-sm transition-all touch-manipulation
                                ${reminded
                                    ? 'bg-white text-orange-600'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }
                                disabled:opacity-50`}
                        >
                            {reminded ? (
                                <>
                                    <BellOff className="w-4 h-4" />
                                    <span>Reminded</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="w-4 h-4" />
                                    <span>Remind Me</span>
                                </>
                            )}
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    )
})

/** Parse countdown data from sticker */
function parseCountdownData(data: string): CountdownData | null {
    try {
        const parsed = JSON.parse(data)
        if (parsed.title && parsed.endDate) {
            return parsed as CountdownData
        }
        return null
    } catch {
        // Old format or invalid - return null
        return null
    }
}
