import { useState, useEffect } from 'react'
import { ContextMenu, type ContextMenuOption, type ContextMenuProps } from './ContextMenu'
import { BottomSheet } from './BottomSheet'

/**
 * Adaptive Context Menu
 * 
 * Automatically chooses between BottomSheet (on mobile) and traditional 
 * ContextMenu (on desktop) based on screen size and touch capability.
 * 
 * This provides the best UX for each platform:
 * - Mobile: Bottom sheet with large touch targets and swipe-to-dismiss
 * - Desktop: Traditional context menu at cursor position
 */

interface AdaptiveContextMenuProps extends Omit<ContextMenuProps, 'position'> {
    position: { x: number; y: number }
    title?: string
}

// Hook to detect if we should use mobile UI
const useIsMobileUI = (): boolean => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            // Consider mobile if:
            // 1. Screen width is less than 768px
            // 2. Device has touch capability (not just hover)
            const isSmallScreen = window.innerWidth < 768
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

            setIsMobile(isSmallScreen && isTouchDevice)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

export const AdaptiveContextMenu = ({
    isOpen,
    position,
    options,
    onClose,
    title,
}: AdaptiveContextMenuProps) => {
    const isMobile = useIsMobileUI()

    // Convert options to format expected by BottomSheet
    const bottomSheetOptions = options.map((opt) => ({
        label: opt.label,
        onClick: opt.onClick,
        variant: opt.variant,
        icon: opt.icon,
        disabled: opt.disabled,
    }))

    if (isMobile) {
        return (
            <BottomSheet
                isOpen={isOpen}
                title={title}
                options={bottomSheetOptions}
                onClose={onClose}
            />
        )
    }

    return (
        <ContextMenu
            isOpen={isOpen}
            position={position}
            options={options as ContextMenuOption[]}
            onClose={onClose}
        />
    )
}

export type { ContextMenuOption }
