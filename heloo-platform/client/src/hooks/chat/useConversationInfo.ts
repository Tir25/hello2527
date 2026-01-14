/**
 * useConversationInfo Hook
 * 
 * Derives conversation details including group/DM status and admin privileges.
 * @module hooks/chat/useConversationInfo
 */

import { useMemo, useState, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { groupService } from '@/lib/services/group.service'
import type { ConversationProfile } from '@/lib/services/user.service'

interface UseConversationInfoOptions {
    selectedUserId?: string
    currentUserId?: string
}

interface ConversationInfo {
    currentConversation: ConversationProfile | undefined
    isGroup: boolean
    groupName?: string
    groupAvatar?: string
    groupDescription?: string
    memberCount?: number
    isGroupAdmin: boolean
}

export function useConversationInfo({
    selectedUserId,
    currentUserId,
}: UseConversationInfoOptions): ConversationInfo {
    const conversations = useChatStore((state) => state.conversations)
    const [isGroupAdmin, setIsGroupAdmin] = useState(false)

    // Get the conversation for the selected user
    const currentConversation = useMemo(() => {
        if (!selectedUserId) return undefined
        return conversations.find((c) => c.id === selectedUserId) as ConversationProfile | undefined
    }, [conversations, selectedUserId])

    // Derive group properties
    const isGroup = currentConversation?.is_group ?? false
    const groupName = isGroup ? (currentConversation?.full_name || currentConversation?.username || undefined) : undefined
    const groupAvatar = isGroup ? (currentConversation?.avatar_url ?? undefined) : undefined
    const groupDescription = isGroup ? (currentConversation?.description ?? undefined) : undefined
    const memberCount = isGroup ? (currentConversation?.member_count ?? 0) : undefined

    // Check admin status
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!isGroup || !selectedUserId || !currentUserId) {
                setIsGroupAdmin(false)
                return
            }
            const isAdmin = await groupService.isGroupAdmin(selectedUserId, currentUserId)
            setIsGroupAdmin(isAdmin)
        }
        checkAdminStatus()
    }, [isGroup, selectedUserId, currentUserId])

    return {
        currentConversation,
        isGroup,
        groupName,
        groupAvatar,
        groupDescription,
        memberCount,
        isGroupAdmin,
    }
}
