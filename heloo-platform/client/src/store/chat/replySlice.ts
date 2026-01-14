/**
 * Reply Slice
 * 
 * Responsibility: Manage reply/quote state for message input
 * Layer: Store (State Management)
 * 
 * Features:
 * - Track which message is being replied to
 * - Clear reply state after sending
 * - Provide reply context for MessageInput
 */

import type { StateCreator } from 'zustand'
import type { DatabaseMessage } from '@/types'

// ===== Types =====

export interface ReplyState {
    /** Message currently being replied to */
    replyingTo: DatabaseMessage | null
}

export interface ReplyActions {
    /** Set the message to reply to */
    setReplyingTo: (message: DatabaseMessage | null) => void
    /** Clear any active reply */
    clearReply: () => void
}

export type ReplySlice = ReplyState & ReplyActions

// ===== Initial State =====

const initialState: ReplyState = {
    replyingTo: null,
}

// ===== Slice Creator =====

export const createReplySlice: StateCreator<ReplySlice, [], [], ReplySlice> = (set) => ({
    ...initialState,

    setReplyingTo: (message) => {
        set({ replyingTo: message })
    },

    clearReply: () => {
        set({ replyingTo: null })
    },
})
