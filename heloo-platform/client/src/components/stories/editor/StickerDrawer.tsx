/**
 * Sticker Drawer Component
 * Bottom sheet for adding stickers with categorized sections
 *
 * @module components/stories/editor/StickerDrawer
 */

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, AtSign, BarChart2, HelpCircle, Hash, Clock } from 'lucide-react'
import { getStickersByCategory } from '@/constants/storyConstants'
import type { Sticker } from '@/types'

interface StickerDrawerProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (sticker: Omit<Sticker, 'id' | 'scale' | 'rotation'>) => void
    onOpenLocationPicker?: () => void
    onOpenMentionPicker?: () => void
    onOpenPollCreator?: () => void
}

/** Icon mapping for sticker types */
const STICKER_ICONS = {
    location: MapPin,
    mention: AtSign,
    poll: BarChart2,
    question: HelpCircle,
    hashtag: Hash,
    countdown: Clock,
} as const

/**
 * Bottom drawer for sticker selection
 */
export const StickerDrawer = memo(function StickerDrawer({
    isOpen,
    onClose,
    onAdd,
    onOpenLocationPicker,
    onOpenMentionPicker,
    onOpenPollCreator
}: StickerDrawerProps) {
    const handleStickerClick = useCallback((type: Sticker['type'], defaultData: string) => {
        // Route to picker for interactive stickers
        if (type === 'location' && onOpenLocationPicker) {
            onClose()
            onOpenLocationPicker()
            return
        }
        if (type === 'mention' && onOpenMentionPicker) {
            onClose()
            onOpenMentionPicker()
            return
        }
        if (type === 'poll' && onOpenPollCreator) {
            onClose()
            onOpenPollCreator()
            return
        }

        // Direct add for simple stickers
        onAdd({ type, x: 0, y: 0, data: defaultData })
        onClose()
    }, [onClose, onAdd, onOpenLocationPicker, onOpenMentionPicker, onOpenPollCreator])

    const interactiveStickers = getStickersByCategory('interactive')
    const decorativeStickers = getStickersByCategory('decorative')

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
                        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
                        className="absolute bottom-0 w-full bg-zinc-900 rounded-t-3xl z-50 p-6 max-h-[70vh] overflow-y-auto"
                        style={{ paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
                    >
                        {/* Handle */}
                        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold text-lg">Stickers</h3>
                            <button
                                onClick={onClose}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors touch-manipulation"
                                aria-label="Close sticker drawer"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Interactive Section */}
                        <StickerSection
                            title="Interactive"
                            stickers={interactiveStickers}
                            onStickerClick={handleStickerClick}
                        />

                        {/* Decorative Section */}
                        <StickerSection
                            title="Decorative"
                            stickers={decorativeStickers}
                            onStickerClick={handleStickerClick}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
})

/** Section component for sticker categories */
interface StickerSectionProps {
    title: string
    stickers: readonly { type: string; label: string; color: string; defaultData: string }[]
    onStickerClick: (type: Sticker['type'], data: string) => void
}

const StickerSection = memo(function StickerSection({
    title,
    stickers,
    onStickerClick
}: StickerSectionProps) {
    if (stickers.length === 0) return null

    return (
        <div className="mb-6">
            <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
                {title}
            </h4>
            <div className="grid grid-cols-3 gap-3">
                {stickers.map(sticker => {
                    const Icon = STICKER_ICONS[sticker.type as keyof typeof STICKER_ICONS]
                    return (
                        <button
                            key={sticker.type}
                            onClick={() => onStickerClick(sticker.type as Sticker['type'], sticker.defaultData)}
                            className="bg-zinc-800 min-h-[80px] p-4 rounded-xl flex flex-col items-center justify-center gap-2 
                                       hover:bg-zinc-700 active:scale-95 transition-all touch-manipulation"
                        >
                            <Icon className={`w-7 h-7 ${sticker.color}`} />
                            <span className="text-xs text-white font-medium">{sticker.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
})
