/**
 * useMentions Hook
 * 
 * Responsibility: Handle @mention detection, filtering, and keyboard navigation
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Detect @ symbol while typing
 * - Filter group members by query
 * - Keyboard navigation (up/down/enter/escape)
 * - Insert selected mention into text
 */

import { useState, useCallback, useMemo } from 'react'
import type { GroupMember } from '@/lib/services/group.service'

interface UseMentionsProps {
    /** Text content from input */
    content: string
    /** Current cursor position */
    cursorPosition: number
    /** Available group members */
    members: GroupMember[]
    /** Callback to update content */
    onContentChange: (content: string) => void
    /** Whether mentions are enabled (only for groups) */
    enabled?: boolean
}

interface UseMentionsReturn {
    /** Whether autocomplete dropdown is open */
    isOpen: boolean
    /** Current search query after @ */
    query: string
    /** Filtered members matching query */
    filteredMembers: GroupMember[]
    /** Currently selected index for keyboard nav */
    selectedIndex: number
    /** Handle keyboard events - returns true if handled */
    handleKeyDown: (e: React.KeyboardEvent) => boolean
    /** Handle member selection */
    handleSelect: (member: GroupMember) => void
    /** Close the autocomplete */
    close: () => void
    /** Position for dropdown (relative to @ position) */
    mentionStartPos: number | null
}

/**
 * Detect @ mention in text before cursor position
 */
const detectMention = (text: string, cursorPos: number): { query: string; startPos: number } | null => {
    if (!text || cursorPos <= 0) return null

    const beforeCursor = text.slice(0, cursorPos)

    // Find the last @ that's either at start or after a space/newline
    const match = beforeCursor.match(/(?:^|[\s\n])@(\w*)$/)

    if (match) {
        const startPos = match.index === 0 ? 0 : (match.index ?? 0) + 1
        return {
            query: match[1],
            startPos
        }
    }

    return null
}

export const useMentions = ({
    content,
    cursorPosition,
    members,
    onContentChange,
    enabled = true,
}: UseMentionsProps): UseMentionsReturn => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Detect mention based on current content and cursor
    const mentionState = useMemo(() => {
        if (!enabled) return null
        return detectMention(content, cursorPosition)
    }, [content, cursorPosition, enabled])

    const isOpen = mentionState !== null && members.length > 0
    const query = mentionState?.query ?? ''
    const mentionStartPos = mentionState?.startPos ?? null

    // Filter members by query
    const filteredMembers = useMemo(() => {
        if (!isOpen || !members.length) return []

        const q = query.toLowerCase()
        return members.filter(member => {
            const name = member.profile?.full_name?.toLowerCase() || ''
            const username = member.profile?.username?.toLowerCase() || ''
            return name.includes(q) || username.includes(q)
        }).slice(0, 6) // Limit to 6 suggestions
    }, [isOpen, query, members])

    // Reset selection when filtered results change
    useMemo(() => {
        if (selectedIndex >= filteredMembers.length) {
            setSelectedIndex(Math.max(0, filteredMembers.length - 1))
        }
    }, [filteredMembers.length, selectedIndex])

    const close = useCallback(() => {
        setSelectedIndex(0)
    }, [])

    const handleSelect = useCallback((member: GroupMember) => {
        if (!mentionState) return

        const username = member.profile?.username || member.profile?.full_name || ''
        const beforeMention = content.slice(0, mentionState.startPos)
        const afterCursor = content.slice(cursorPosition)

        // Insert @username followed by a space
        const newContent = `${beforeMention}@${username} ${afterCursor}`
        onContentChange(newContent)

        close()
    }, [content, cursorPosition, mentionState, onContentChange, close])

    const handleKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
        if (!isOpen || filteredMembers.length === 0) return false

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev < filteredMembers.length - 1 ? prev + 1 : 0
                )
                return true

            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredMembers.length - 1
                )
                return true

            case 'Enter':
            case 'Tab':
                e.preventDefault()
                handleSelect(filteredMembers[selectedIndex])
                return true

            case 'Escape':
                e.preventDefault()
                close()
                return true

            default:
                return false
        }
    }, [isOpen, filteredMembers, selectedIndex, handleSelect, close])

    return {
        isOpen,
        query,
        filteredMembers,
        selectedIndex,
        handleKeyDown,
        handleSelect,
        close,
        mentionStartPos,
    }
}
