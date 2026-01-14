/**
 * Story Overlays Component
 * Renders text overlays and stickers on viewed stories
 *
 * @module components/stories/viewer/StoryOverlays
 */

import { memo } from 'react'
import { MapPin, AtSign, HelpCircle, Hash, Clock } from 'lucide-react'
import type { TextOverlay, Sticker } from '@/types'
import { PollDisplay } from './PollDisplay'

interface StoryOverlaysProps {
    storyId?: string
    textOverlays?: TextOverlay[]
    stickers?: Sticker[]
    /** Whether this is the current user's story */
    isOwnStory?: boolean
    /** Callback when poll loading state changes - use to pause story timer */
    onPollLoadingChange?: (isLoading: boolean) => void
}

/** Icon mapping for non-poll sticker types */
const STICKER_ICONS = {
    location: MapPin,
    mention: AtSign,
    question: HelpCircle,
    hashtag: Hash,
    countdown: Clock,
} as const

/** Color mapping for sticker types */
const STICKER_COLORS = {
    location: 'text-red-500',
    mention: 'text-blue-500',
    question: 'text-purple-500',
    hashtag: 'text-cyan-500',
    countdown: 'text-orange-500',
} as const

/**
 * Renders text and sticker overlays
 */
export const StoryOverlays = memo(function StoryOverlays({
    storyId,
    textOverlays = [],
    stickers = [],
    isOwnStory = false,
    onPollLoadingChange
}: StoryOverlaysProps) {
    if (textOverlays.length === 0 && stickers.length === 0) {
        return null
    }

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* Text Overlays */}
            {textOverlays.map(t => (
                <TextOverlayItem key={t.id} overlay={t} />
            ))}

            {/* Stickers */}
            {stickers.map(s => (
                s.type === 'poll' && storyId ? (
                    <PollDisplay
                        key={s.id}
                        storyId={storyId}
                        stickerId={s.id}
                        data={s.data}
                        x={s.x}
                        y={s.y}
                        isOwnStory={isOwnStory}
                        onLoadingChange={onPollLoadingChange}
                    />
                ) : (
                    <StickerItem key={s.id} sticker={s} />
                )
            ))}
        </div>
    )
})

/** Individual text overlay item */
const TextOverlayItem = memo(function TextOverlayItem({
    overlay
}: {
    overlay: TextOverlay
}) {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
                transform: `translate(${overlay.x}px, ${overlay.y}px) scale(${overlay.scale || 1})`
            }}
        >
            <span
                className={`font-bold text-3xl ${overlay.font || 'font-sans'}`}
                style={{
                    color: overlay.color || '#ffffff',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
            >
                {overlay.text}
            </span>
        </div>
    )
})

/** Individual sticker item (non-poll) */
const StickerItem = memo(function StickerItem({
    sticker
}: {
    sticker: Sticker
}) {
    if (sticker.type === 'poll') return null // Handled by PollDisplay

    const Icon = STICKER_ICONS[sticker.type as keyof typeof STICKER_ICONS]
    const colorClass = STICKER_COLORS[sticker.type as keyof typeof STICKER_COLORS]

    if (!Icon) return null

    return (
        <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
                transform: `translate(${sticker.x}px, ${sticker.y}px) scale(${sticker.scale || 1}) rotate(${sticker.rotation || 0}deg)`
            }}
        >
            <div className="bg-white/95 backdrop-blur-sm text-black px-4 py-2 rounded-xl shadow-xl font-bold flex items-center gap-2">
                <Icon className={`w-5 h-5 ${colorClass}`} />
                <span className="text-sm">{sticker.data}</span>
            </div>
        </div>
    )
})
