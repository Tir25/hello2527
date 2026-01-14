/**
 * useChatCallHandlers Hook
 * 
 * Call button handlers for chat header.
 * @module hooks/chat/useChatCallHandlers
 */

import { useCallback } from 'react'
import { useCallContext } from '@/context/call'

interface UseChatCallHandlersOptions {
    selectedUserId?: string
    currentUserId?: string
    isGroup: boolean
    canChat: boolean
}

interface ChatCallHandlers {
    onVideoCall?: () => void
    onVoiceCall?: () => void
    callsEnabled: boolean
}

export function useChatCallHandlers({
    selectedUserId,
    currentUserId,
    isGroup,
    canChat,
}: UseChatCallHandlersOptions): ChatCallHandlers {
    const { startDMCall, startGroupCall, callStatus } = useCallContext()
    const callsEnabled = callStatus === 'idle' && canChat

    const handleCall = useCallback(() => {
        if (!selectedUserId) return
        if (isGroup && currentUserId) {
            startGroupCall(selectedUserId, currentUserId)
        } else {
            startDMCall(selectedUserId)
        }
    }, [selectedUserId, currentUserId, isGroup, startDMCall, startGroupCall])

    return {
        onVideoCall: canChat ? handleCall : undefined,
        onVoiceCall: canChat ? handleCall : undefined,
        callsEnabled,
    }
}
