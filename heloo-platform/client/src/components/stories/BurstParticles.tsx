/**
 * Burst Ring Effect
 * Simple ring expansion for story bubble tap
 * 
 * @module components/stories/BurstParticles
 */

import { memo, useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import './BurstParticles.css'

interface BurstParticlesProps {
    onComplete?: () => void
}

/**
 * Minimal burst effect - single expanding ring
 * Optimized for mobile performance
 */
export const BurstParticles = memo(function BurstParticles({ onComplete }: BurstParticlesProps) {
    const prefersReducedMotion = useReducedMotion()
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const duration = prefersReducedMotion ? 50 : 300
        const timer = setTimeout(() => {
            setIsVisible(false)
            onComplete?.()
        }, duration)
        return () => clearTimeout(timer)
    }, [onComplete, prefersReducedMotion])

    if (!isVisible) return null

    return (
        <div className="burst-container">
            <div className="burst-ring" />
        </div>
    )
})
