import { useEffect, useCallback } from 'react'

/**
 * Auto Scroll Hook
 * 
 * Responsibility: Manages automatic scrolling behavior
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Scrolls to bottom on new messages
 * - Handles keyboard appearance (mobile)
 * - Respects user scroll position
 */

type ScrollBehaviorType = 'auto' | 'smooth'

export interface UseAutoScrollProps {
    messages: unknown[]
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    messagesContainerRef: React.RefObject<HTMLDivElement | null>
}

export interface UseAutoScrollReturn {
    scrollToBottom: (behavior?: ScrollBehaviorType) => void
}

export const useAutoScroll = ({
    messages,
    messagesEndRef,
    messagesContainerRef,
}: UseAutoScrollProps): UseAutoScrollReturn => {
    const NEAR_BOTTOM_THRESHOLD_PX = 160

    const scrollToBottom = useCallback((behavior: ScrollBehaviorType = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
        }
    }, [messagesEndRef])

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom('smooth')
    }, [messages, scrollToBottom])

    // Handle viewport changes (keyboard appearance on mobile)
    useEffect(() => {
        const container = messagesContainerRef.current
        if (!container) return

        const isNearBottom = () => {
            const distanceFromBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight
            return distanceFromBottom <= NEAR_BOTTOM_THRESHOLD_PX
        }

        const handleViewportChange = () => {
            if (!isNearBottom()) return
            scrollToBottom('smooth')
        }

        const visualViewport = window.visualViewport
        visualViewport?.addEventListener('resize', handleViewportChange)
        visualViewport?.addEventListener('scroll', handleViewportChange)

        const handleWindowResize = () => {
            if (!isNearBottom()) return
            scrollToBottom('smooth')
        }

        window.addEventListener('resize', handleWindowResize)

        return () => {
            visualViewport?.removeEventListener('resize', handleViewportChange)
            visualViewport?.removeEventListener('scroll', handleViewportChange)
            window.removeEventListener('resize', handleWindowResize)
        }
    }, [messagesEndRef, messagesContainerRef, scrollToBottom])

    return { scrollToBottom }
}
