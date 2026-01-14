/**
 * useMentionParser Hook
 * 
 * Parses @mentions from message text and returns mentioned user IDs.
 * 
 * @module hooks/chat/useMentionParser
 */

import { useCallback } from 'react'
import type { GroupMember } from '@/lib/services/group.service'

/** Regex to match @username patterns */
const MENTION_REGEX = /@(\w+)/g

interface ParseMentionsResult {
    /** Array of mentioned user IDs */
    mentionedUserIds: string[]
    /** Original content (can be used for formatting later) */
    formattedContent: string
}

/**
 * Hook for parsing @mentions from text
 */
export const useMentionParser = () => {
    /**
     * Parse mentions from text content
     * @param content - The message text content
     * @param members - Available group members to match against
     * @returns Object containing mentioned user IDs and formatted content
     */
    const parseMentions = useCallback((
        content: string,
        members: GroupMember[]
    ): ParseMentionsResult => {
        const mentionedUserIds: string[] = []
        let formattedContent = content

        // Find all @mentions in the content
        const matches = content.matchAll(MENTION_REGEX)

        for (const match of matches) {
            const username = match[1].toLowerCase()

            // Find matching member
            const member = members.find(m => {
                const memberUsername = m.profile?.username?.toLowerCase() || ''
                const memberName = m.profile?.full_name?.toLowerCase().replace(/\s+/g, '') || ''
                return memberUsername === username || memberName === username
            })

            if (member && !mentionedUserIds.includes(member.user_id)) {
                mentionedUserIds.push(member.user_id)
            }
        }

        return {
            mentionedUserIds,
            formattedContent,
        }
    }, [])

    /**
     * Check if a string contains mentions
     */
    const hasMentions = useCallback((content: string): boolean => {
        return MENTION_REGEX.test(content)
    }, [])

    return {
        parseMentions,
        hasMentions,
        MENTION_REGEX,
    }
}
