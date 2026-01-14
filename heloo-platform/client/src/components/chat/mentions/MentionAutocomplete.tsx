/**
 * MentionAutocomplete Component
 * 
 * Dropdown autocomplete for @mentions when typing @ in message input.
 * Shows matching group members to tag.
 * 
 * @module components/chat/mentions/MentionAutocomplete
 */

import { memo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { GroupMember } from '@/lib/services/group.service'

interface MentionAutocompleteProps {
    /** Current query after @ symbol */
    query: string
    /** Available group members to suggest */
    members: GroupMember[]
    /** Whether the dropdown is visible */
    isOpen: boolean
    /** Selected index for keyboard navigation */
    selectedIndex: number
    /** Callback when a member is selected */
    onSelect: (member: GroupMember) => void
    /** Position for the dropdown */
    position?: React.CSSProperties
    /** Additional CSS classes */
    className?: string
}

const MentionAutocompleteComponent = ({
    query,
    members,
    isOpen,
    selectedIndex,
    onSelect,
    position,
    className,
}: MentionAutocompleteProps) => {
    const listRef = useRef<HTMLDivElement>(null)

    // Filter members by query
    const filteredMembers = members.filter(member => {
        const name = member.profile?.full_name?.toLowerCase() || ''
        const username = member.profile?.username?.toLowerCase() || ''
        const q = query.toLowerCase()
        return name.includes(q) || username.includes(q)
    }).slice(0, 6) // Limit to 6 suggestions

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && selectedIndex >= 0) {
            const items = listRef.current.querySelectorAll('[data-mention-item]')
            items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

    if (!isOpen || filteredMembers.length === 0) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                ref={listRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className={cn(
                    "absolute z-50 w-64 max-h-[200px] overflow-y-auto",
                    "bg-white rounded-xl shadow-xl border border-gray-200",
                    "py-1",
                    className
                )}
                style={position}
                role="listbox"
                aria-label="Mention suggestions"
            >
                {filteredMembers.map((member, index) => (
                    <button
                        key={member.user_id}
                        data-mention-item
                        onClick={() => onSelect(member)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left",
                            "transition-colors",
                            index === selectedIndex
                                ? "bg-purple-50"
                                : "hover:bg-gray-50"
                        )}
                        role="option"
                        aria-selected={index === selectedIndex}
                    >
                        {/* Avatar */}
                        {member.profile?.avatar_url ? (
                            <img
                                src={member.profile.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 
                                          flex items-center justify-center text-white text-sm font-medium">
                                {(member.profile?.full_name || member.profile?.username || '?')[0].toUpperCase()}
                            </div>
                        )}

                        {/* Name & Username */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {member.profile?.full_name || 'Unknown'}
                            </p>
                            {member.profile?.username && (
                                <p className="text-xs text-gray-500 truncate">
                                    @{member.profile.username}
                                </p>
                            )}
                        </div>
                    </button>
                ))}
            </motion.div>
        </AnimatePresence>
    )
}

export const MentionAutocomplete = memo(MentionAutocompleteComponent)
MentionAutocomplete.displayName = 'MentionAutocomplete'
