/**
 * Countdown Picker Component
 * Modal for creating countdown stickers with title and end date
 *
 * @module components/stories/editor/stickers/CountdownPicker
 */

import { memo, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertCircle } from 'lucide-react'

interface CountdownPickerProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (title: string, endDate: string) => void
}

/**
 * Countdown picker modal with title input and datetime selector
 */
export const CountdownPicker = memo(function CountdownPicker({
    isOpen,
    onClose,
    onConfirm
}: CountdownPickerProps) {
    const [title, setTitle] = useState('Countdown')
    const [endDate, setEndDate] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Get minimum datetime (now + 1 minute)
    const minDateTime = useMemo(() => {
        const now = new Date()
        now.setMinutes(now.getMinutes() + 1)
        return now.toISOString().slice(0, 16)
    }, [])

    const handleDateChange = useCallback((value: string) => {
        setEndDate(value)
        setError(null)
    }, [])

    const handleSubmit = useCallback(() => {
        if (!endDate) {
            setError('Please select an end date')
            return
        }

        const selectedDate = new Date(endDate)
        if (selectedDate <= new Date()) {
            setError('End date must be in the future')
            return
        }

        const countdownTitle = title.trim() || 'Countdown'
        onConfirm(countdownTitle, selectedDate.toISOString())

        // Reset state
        setTitle('Countdown')
        setEndDate('')
        setError(null)
        onClose()
    }, [title, endDate, onConfirm, onClose])

    const handleClose = useCallback(() => {
        setTitle('Countdown')
        setEndDate('')
        setError(null)
        onClose()
    }, [onClose])

    const isValid = endDate && new Date(endDate) > new Date()

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col"
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-4 border-b border-white/10"
                        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
                    >
                        <button
                            onClick={handleClose}
                            className="min-w-[60px] min-h-[44px] flex items-center justify-start text-zinc-400 font-medium touch-manipulation"
                        >
                            Cancel
                        </button>
                        <h2 className="text-white font-bold text-lg">Countdown</h2>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid}
                            className="min-w-[60px] min-h-[44px] flex items-center justify-end text-blue-500 font-bold disabled:opacity-50 touch-manipulation"
                        >
                            Done
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Title Input */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Event name..."
                                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl
                                    placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500"
                                maxLength={50}
                            />
                        </div>

                        {/* Date/Time Picker */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Countdown Ends
                            </label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={e => handleDateChange(e.target.value)}
                                min={minDateTime}
                                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl
                                    outline-none focus:ring-2 focus:ring-orange-500
                                    [color-scheme:dark]"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Preview */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Preview
                            </label>
                            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl p-4 border border-orange-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    <span className="text-white font-bold">
                                        {title || 'Countdown'}
                                    </span>
                                </div>
                                <div className="text-white/80 text-2xl font-mono text-center">
                                    {endDate ? formatPreviewTime(endDate) : '--:--:--:--'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

/** Format preview time as DD:HH:MM:SS */
function formatPreviewTime(endDate: string): string {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.max(0, end.getTime() - now.getTime())

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
