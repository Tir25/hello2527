/**
 * BackButton Component
 * 
 * Back navigation button for mobile view.
 * @module components/features/ChatHeader/BackButton
 */

import { memo } from 'react'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    onClick: () => void
    visible?: boolean
}

export const BackButton = memo(function BackButton({
    onClick,
    visible = true,
}: BackButtonProps) {
    if (!visible) return null

    return (
        <button
            onClick={onClick}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors md:hidden"
            aria-label="Go back"
        >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
    )
})
