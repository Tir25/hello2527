/**
 * NewGroupModal Header
 * 
 * Header section with title and close button.
 */

import { memo } from 'react'
import { X, Users } from 'lucide-react'

interface ModalHeaderProps {
    onClose: () => void
}

export const ModalHeader = memo(function ModalHeader({ onClose }: ModalHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                       flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900">New Group</h2>
                    <p className="text-sm text-gray-500">Add members to start chatting</p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full 
                  hover:bg-gray-100 active:scale-95 transition-all"
                aria-label="Close modal"
                type="button"
            >
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>
    )
})
