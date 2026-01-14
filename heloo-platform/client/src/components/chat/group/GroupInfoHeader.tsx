/**
 * GroupInfoHeader Component
 * 
 * Header section of the Group Info panel.
 * Contains title, edit button (admin only), and close button.
 * 
 * Responsibility: Panel header with navigation controls
 */

import { memo } from 'react'
import { X, Edit2 } from 'lucide-react'

interface GroupInfoHeaderProps {
    isAdmin: boolean
    onEditClick: () => void
    onClose: () => void
}

export const GroupInfoHeader = memo(({
    isAdmin,
    onEditClick,
    onClose,
}: GroupInfoHeaderProps) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 text-lg">Group Info</h2>
            <div className="flex items-center gap-2">
                {isAdmin && (
                    <button
                        onClick={onEditClick}
                        className="w-10 h-10 flex items-center justify-center rounded-full 
                                  hover:bg-gray-100 active:scale-95 transition-all"
                        aria-label="Edit group"
                    >
                        <Edit2 className="w-5 h-5 text-gray-500" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full 
                              hover:bg-gray-100 active:scale-95 transition-all"
                    aria-label="Close panel"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>
        </div>
    )
})

GroupInfoHeader.displayName = 'GroupInfoHeader'
