/**
 * Reaction Trigger Button
 * 
 * Responsibility: Button to open reaction picker
 * Layer: UI Component (Presenter)
 * 
 * Features:
 * - Visible on hover (desktop)
 * - Always visible on mobile (via touch detection)
 * - Accessible with proper ARIA labels
 * 
 * @module components/chat/message/ReactionTrigger
 */

import { memo, useState, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ReactionTriggerProps {
    position: 'left' | 'right'
    onOpenPicker: (position: { x: number; y: number }) => void
    /** Force visibility (useful for mobile) */
    forceVisible?: boolean
}

/**
 * Detect if device supports touch (mobile detection)
 */
const useIsTouchDevice = () => {
    const [isTouch, setIsTouch] = useState(false)

    useEffect(() => {
        // Check for touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        setIsTouch(hasTouch)
    }, [])

    return isTouch
}

const ReactionTriggerComponent = ({
    position,
    onOpenPicker,
    forceVisible = false,
}: ReactionTriggerProps) => {
    const isTouchDevice = useIsTouchDevice()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        if (position === 'left') {
            onOpenPicker({ x: rect.left - 100, y: rect.top - 50 })
        } else {
            onOpenPicker({ x: rect.right + 10, y: rect.top - 50 })
        }
    }

    // On touch devices, keep visible; on desktop, use hover
    const visibilityClass = isTouchDevice || forceVisible
        ? 'opacity-70'  // Always visible but subtle on mobile
        : 'opacity-0 group-hover/message:opacity-100'  // Hover-based on desktop

    return (
        <button
            onClick={handleClick}
            className={cn(
                "p-1.5 rounded-full bg-white/80 shadow-sm border border-gray-200/50",
                "hover:bg-gray-100 transition-all active:scale-95 flex-shrink-0",
                visibilityClass
            )}
            aria-label="Add reaction"
        >
            <Smile size={16} className="text-gray-500" />
        </button>
    )
}

export const ReactionTrigger = memo(ReactionTriggerComponent)
ReactionTrigger.displayName = 'ReactionTrigger'
