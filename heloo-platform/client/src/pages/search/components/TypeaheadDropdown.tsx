/**
 * Typeahead Dropdown Component
 * 
 * Responsibility: Display typeahead suggestions with keyboard support
 * Layer: UI Component (Presentational)
 * 
 * Features:
 * - Animated dropdown with suggestions
 * - Keyboard navigation highlighting
 * - Avatar + name display
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Avatar } from '@/components/ui/Avatar'
import type { TypeaheadSuggestion } from '../hooks/useTypeahead'

interface TypeaheadDropdownProps {
    suggestions: TypeaheadSuggestion[]
    selectedIndex: number
    isOpen: boolean
    onSelect: (suggestion: TypeaheadSuggestion) => void
}

export const TypeaheadDropdown = memo(({
    suggestions,
    selectedIndex,
    isOpen,
    onSelect,
}: TypeaheadDropdownProps) => {
    if (!isOpen || suggestions.length === 0) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
            >
                <ul className="py-1" role="listbox">
                    {suggestions.map((suggestion, index) => (
                        <SuggestionItem
                            key={suggestion.id}
                            suggestion={suggestion}
                            isSelected={index === selectedIndex}
                            onSelect={onSelect}
                        />
                    ))}
                </ul>
            </motion.div>
        </AnimatePresence>
    )
})

TypeaheadDropdown.displayName = 'TypeaheadDropdown'

/**
 * Individual Suggestion Item
 */
const SuggestionItem = memo(({
    suggestion,
    isSelected,
    onSelect,
}: {
    suggestion: TypeaheadSuggestion
    isSelected: boolean
    onSelect: (suggestion: TypeaheadSuggestion) => void
}) => {
    const displayName = suggestion.full_name || suggestion.username || 'User'

    // Create a minimal profile object for Avatar
    const avatarProfile = {
        id: suggestion.id,
        avatar_url: suggestion.avatar_url,
        full_name: suggestion.full_name,
        username: suggestion.username,
        email: '',
        phone: null,
        status: null,
        last_seen: null,
        created_at: null,
    }

    return (
        <li
            role="option"
            aria-selected={isSelected}
            className={`
                flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors touch-manipulation
                ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50 active:bg-gray-100'}
            `}
            onClick={() => onSelect(suggestion)}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
            <Avatar profile={avatarProfile} size="sm" className="flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                        {displayName}
                    </span>
                </div>
                {suggestion.username && suggestion.full_name && (
                    <span className="text-sm text-gray-500 truncate block">
                        @{suggestion.username}
                    </span>
                )}
            </div>

            {isSelected && (
                <span className="text-xs text-purple-500 font-medium">
                    Enter ↵
                </span>
            )}
        </li>
    )
})

SuggestionItem.displayName = 'SuggestionItem'
