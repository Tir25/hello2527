/**
 * Rising Bubbles Effect
 * Playful floating bubbles inside story avatar
 * 
 * @module components/stories/RisingBubbles
 */

import { memo } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import './RisingBubbles.css'

/**
 * Rising bubbles animation for unviewed stories
 * Uses CSS animations for GPU acceleration
 */
export const RisingBubbles = memo(function RisingBubbles() {
    const prefersReducedMotion = useReducedMotion()

    if (prefersReducedMotion) return null

    return (
        <div className="rising-bubbles-container">
            <div className="rising-bubble rising-bubble-1" />
            <div className="rising-bubble rising-bubble-2" />
            <div className="rising-bubble rising-bubble-3" />
        </div>
    )
})
