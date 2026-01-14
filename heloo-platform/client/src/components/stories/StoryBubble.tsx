/**
 * Story Bubble
 * Playful futuristic avatar with holographic ring
 * Performance optimized for mobile
 * 
 * @module components/stories/StoryBubble
 */

import { memo, useCallback } from 'react'
import { RisingBubbles } from './RisingBubbles'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import './StoryBubble.css'

interface StoryBubbleProps {
    username: string
    avatarUrl: string | null
    hasUnviewed: boolean
    isMine?: boolean
    isCloseFriends?: boolean
    onClick?: () => void
}

/**
 * Story bubble with holographic ring for unviewed stories
 * Optimized: No blocking animations, minimal DOM, GPU-friendly CSS
 */
export const StoryBubble = memo(function StoryBubble({
    username,
    avatarUrl,
    hasUnviewed,
    isMine = false,
    isCloseFriends = false,
    onClick,
}: StoryBubbleProps) {
    const prefersReducedMotion = useReducedMotion()

    const handleClick = useCallback(() => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([10])
        }
        // Open immediately - no blocking animation
        onClick?.()
    }, [onClick])

    return (
        <div className="story-bubble-wrapper" onClick={handleClick}>
            <div className="story-bubble-container">

                {/* Holographic ring for unviewed stories */}
                {hasUnviewed && (
                    <>
                        <div className={`story-bubble-holo ${isCloseFriends ? 'story-bubble-holo-green' : ''}`}>
                            <div className="story-bubble-holo-inner" />
                        </div>

                        {/* Ripple effect */}
                        {!prefersReducedMotion && (
                            <div className="story-bubble-ripple" />
                        )}

                        {/* Rising bubbles */}
                        <RisingBubbles />
                    </>
                )}

                {/* Avatar */}
                <div className={`story-bubble-avatar ${!hasUnviewed ? 'story-bubble-avatar-viewed' : ''}`}>
                    <img
                        src={avatarUrl || '/default-avatar.svg'}
                        alt={username}
                        loading="lazy"
                        className="story-bubble-avatar-img"
                    />
                </div>
            </div>

            {/* Username */}
            <span className={`story-bubble-username ${!hasUnviewed ? 'story-bubble-username-viewed' : ''}`}>
                {isMine ? 'Your story' : username}
            </span>
        </div>
    )
})
