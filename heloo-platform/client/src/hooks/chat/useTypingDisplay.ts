/**
 * useTypingDisplay Hook
 * 
 * Responsibility: Format and display typing indicator state
 * Layer: Custom Hook
 * 
 * Extracted from ChatWindow to improve modularity.
 * Handles:
 * - Checking if anyone is typing in current conversation
 * - Formatting typing names for display (single, pair, multiple)
 * - Supporting both DM and group typing indicators
 */

import { useMemo } from 'react'
import { useChatStore } from '@/store/chatStore'

interface UseTypingDisplayProps {
    selectedUserId: string | null | undefined
    isGroup: boolean
    userName: string
    canShowTyping: boolean
}

interface UseTypingDisplayReturn {
    shouldShowTyping: boolean
    typingDisplayName: string
}

export const useTypingDisplay = ({
    selectedUserId,
    isGroup,
    userName,
    canShowTyping,
}: UseTypingDisplayProps): UseTypingDisplayReturn => {
    const typingUsers = useChatStore((state) => state.typingUsers)
    const isUserTyping = useChatStore((state) => state.isUserTyping)
    const getTypingUserNames = useChatStore((state) => state.getTypingUserNames)

    const result = useMemo(() => {
        if (!selectedUserId || !canShowTyping) {
            return { shouldShowTyping: false, typingDisplayName: '' }
        }

        // For DMs: check if selectedUser is typing
        // For Groups: check if ANY user is typing (typingUsers.size > 0)
        const shouldShowTyping = isGroup
            ? typingUsers.size > 0
            : isUserTyping(selectedUserId)

        if (!shouldShowTyping) {
            return { shouldShowTyping: false, typingDisplayName: '' }
        }

        // Get typing display name
        let typingDisplayName: string

        if (isGroup) {
            const typingNames = getTypingUserNames()
            if (typingNames.length === 0) {
                typingDisplayName = 'Someone'
            } else if (typingNames.length === 1) {
                typingDisplayName = typingNames[0]
            } else if (typingNames.length === 2) {
                typingDisplayName = `${typingNames[0]} and ${typingNames[1]}`
            } else {
                typingDisplayName = `${typingNames[0]} and ${typingNames.length - 1} others`
            }
        } else {
            typingDisplayName = userName
        }

        return { shouldShowTyping, typingDisplayName }
    }, [selectedUserId, isGroup, canShowTyping, typingUsers.size, isUserTyping, getTypingUserNames, userName])

    return result
}
