/**
 * ConnectionTabButton Component
 * 
 * Tab button for switching between followers/following.
 * @module features/profile/components/ConnectionTabButton
 */

import { memo } from 'react'

interface ConnectionTabButtonProps {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    count: number
}

const ConnectionTabButtonComponent = ({ active, onClick, icon, label, count }: ConnectionTabButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        aria-selected={active}
        role="tab"
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${active
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
    >
        {icon}
        <span>{label}</span>
        <span className={`px-1.5 py-0.5 text-xs rounded-full ${active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
            }`}>
            {count}
        </span>
    </button>
)

export const ConnectionTabButton = memo(ConnectionTabButtonComponent)
ConnectionTabButton.displayName = 'ConnectionTabButton'
