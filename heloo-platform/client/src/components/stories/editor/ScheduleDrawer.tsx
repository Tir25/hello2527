/**
 * Schedule Drawer Component
 * Bottom sheet for scheduling story posts
 * 
 * @module components/stories/editor/ScheduleDrawer
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock } from 'lucide-react'

interface ScheduleDrawerProps {
    isOpen: boolean
    currentTime: string | null
    onClose: () => void
    onConfirm: (time: string | null) => void
}

/**
 * Bottom drawer for scheduling stories
 */
export const ScheduleDrawer = memo(function ScheduleDrawer({
    isOpen,
    currentTime,
    onClose,
    onConfirm
}: ScheduleDrawerProps) {
    const [selectedTime, setSelectedTime] = useState(currentTime || '')

    const handleConfirm = () => {
        // Convert local datetime-local value to ISO UTC string
        const isoTime = selectedTime ? new Date(selectedTime).toISOString() : null
        onConfirm(isoTime)
        onClose()
    }

    const handleClear = () => {
        setSelectedTime('')
        onConfirm(null)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 z-40 bg-black/50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="absolute bottom-0 w-full bg-zinc-900 rounded-t-3xl z-50 p-6"
                        style={{ paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-bold text-lg">Schedule Story</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-800 rounded-full touch-manipulation"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Date/Time Picker */}
                        <input
                            type="datetime-local"
                            value={selectedTime}
                            onChange={e => setSelectedTime(e.target.value)}
                            className="w-full bg-zinc-800 text-white p-4 rounded-xl mb-4 outline-none border border-transparent focus:border-blue-500"
                        />

                        {/* Actions */}
                        <div className="flex gap-3">
                            {currentTime && (
                                <button
                                    onClick={handleClear}
                                    className="flex-1 min-h-[52px] bg-zinc-800 text-white font-medium rounded-xl touch-manipulation"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                className="flex-1 min-h-[52px] bg-blue-600 text-white font-bold rounded-xl touch-manipulation"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
})
