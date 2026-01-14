/**
 * NewGroupModal Contact Item
 * 
 * Renders a single contact row for member selection.
 * Used in the contacts list of NewGroupModal.
 */

import { memo } from 'react'
import { Check } from 'lucide-react'
import type { Profile } from '@/lib/services/profile.service'

interface ContactItemProps {
    contact: Profile
    isSelected: boolean
    onToggle: (contact: Profile) => void
}

/**
 * Individual contact row with selection state
 */
export const ContactItem = memo(function ContactItem({
    contact,
    isSelected,
    onToggle
}: ContactItemProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(contact)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
                 active:scale-[0.98] min-h-[56px]
                 ${isSelected
                    ? 'bg-purple-50 border-2 border-purple-400'
                    : 'bg-gray-50/50 border-2 border-transparent hover:bg-gray-100/80'}`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {contact.avatar_url ? (
                    <img
                        src={contact.avatar_url}
                        alt={contact.full_name || contact.username || 'User'}
                        className="w-11 h-11 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 
                          flex items-center justify-center text-white font-semibold">
                        {(contact.full_name || contact.username || '?')[0].toUpperCase()}
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-gray-900 truncate">
                    {contact.full_name || contact.username || 'Unknown'}
                </p>
                {contact.username && contact.full_name && (
                    <p className="text-sm text-gray-500 truncate">@{contact.username}</p>
                )}
            </div>

            {/* Check indicator */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                       transition-all
                       ${isSelected
                    ? 'bg-purple-500 text-white scale-100'
                    : 'bg-gray-200 scale-90'}`}>
                {isSelected && <Check className="w-4 h-4" />}
            </div>
        </button>
    )
})
