/**
 * useChatRelationship Hook
 * 
 * Responsibility: Manage relationship state for chat conversations
 * Layer: Custom Hook
 * 
 * Extracted from ChatWindow to improve modularity.
 * Handles:
 * - Following status (amIFollowing, isFollowingMe)
 * - Blocked status
 * - Relationship checking and caching
 */

import { useState, useCallback, useEffect } from 'react'
import { profileService } from '@/lib/services/profile.service'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'

interface UseChatRelationshipProps {
    selectedUserId: string | null | undefined
    currentUserId: string | null | undefined
    isGroup: boolean
}

interface UseChatRelationshipReturn {
    amIFollowing: boolean
    isFollowingMe: boolean
    isBlocked: boolean
    relationshipLoading: boolean
    canChat: boolean
    checkRelationship: () => Promise<void>
    handleRelationshipChange: () => void
}

export const useChatRelationship = ({
    selectedUserId,
    currentUserId,
    isGroup,
}: UseChatRelationshipProps): UseChatRelationshipReturn => {
    const [amIFollowing, setAmIFollowing] = useState(false)
    const [isFollowingMe, setIsFollowingMe] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [relationshipLoading, setRelationshipLoading] = useState(false)

    const fetchMessages = useChatStore((state) => state.fetchMessages)
    const fetchGroupMessages = useChatStore((state) => state.fetchGroupMessages)
    const conversations = useChatStore((state) => state.conversations)

    /**
     * Check relationship status with selected user
     * Fetches profile data to determine following/blocked status
     * 
     * Note: Groups don't have user relationships - skip for group chats
     */
    const checkRelationship = useCallback(async () => {
        // Groups don't have user relationships - skip profile fetch entirely
        // This prevents "Profile access blocked" warning for group IDs
        if (isGroup) {
            setAmIFollowing(false)
            setIsFollowingMe(false)
            setIsBlocked(false)
            return
        }

        if (!selectedUserId || !currentUserId || selectedUserId === currentUserId) {
            setAmIFollowing(false)
            setIsFollowingMe(false)
            setIsBlocked(false)
            return
        }

        try {
            setRelationshipLoading(true)
            const result = await profileService.getProfile(selectedUserId, true, true)

            if (result.success && result.data) {
                setAmIFollowing(result.data.amIFollowing ?? false)
                setIsFollowingMe(result.data.isFollowingMe ?? false)
                setIsBlocked(result.data.relationship_status === 'blocked')
            }
        } catch (error) {
            logger.error('useChatRelationship:checkRelationship', 'Failed to check relationship', error)
            setAmIFollowing(false)
            setIsFollowingMe(false)
            setIsBlocked(false)
        } finally {
            setRelationshipLoading(false)
        }
    }, [selectedUserId, currentUserId, isGroup])

    /**
     * Reload relationship status after user action
     * Also refreshes messages in case relationship changed
     */
    const handleRelationshipChange = useCallback(() => {
        checkRelationship()

        // Refresh messages in case relationship changed from pending to accepted
        if (selectedUserId && currentUserId) {
            const conv = conversations.find((c) => c.id === selectedUserId)
            if (conv?.is_group) {
                fetchGroupMessages(selectedUserId)
            } else {
                fetchMessages(selectedUserId, currentUserId)
            }
        }
    }, [checkRelationship, selectedUserId, currentUserId, fetchMessages, fetchGroupMessages, conversations])

    // Reset state when selected user changes
    useEffect(() => {
        if (!selectedUserId) {
            setAmIFollowing(false)
            setIsFollowingMe(false)
            setIsBlocked(false)
        }
    }, [selectedUserId])

    // Determine if user can chat
    // For groups: always can chat (member of group)
    // For DMs: can chat if at least one follows the other
    const canChat = isGroup || amIFollowing || isFollowingMe

    return {
        amIFollowing,
        isFollowingMe,
        isBlocked,
        relationshipLoading,
        canChat,
        checkRelationship,
        handleRelationshipChange,
    }
}
