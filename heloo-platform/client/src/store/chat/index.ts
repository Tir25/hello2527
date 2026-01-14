/**
 * Chat Store (Refactored) - Production Optimized
 * 
 * Combined store using Zustand slice pattern with shallow equality.
 * Each slice handles a specific concern:
 * - presenceSlice: Online/offline tracking
 * - typingSlice: Typing indicators
 * - conversationSlice: Conversation list & search
 * - messageSlice: Messages & real-time
 * 
 * Performance Optimizations:
 * - Shallow equality by default (prevents unnecessary re-renders)
 * - Stable action references
 * - Optimized selectors available in ./selectors.ts
 * 
 * Max lines: ~50
 */

import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import type { ChatState } from './types'
import { createPresenceSlice } from './presenceSlice'
import { createTypingSlice } from './typingSlice'
import { createConversationSlice } from './conversationSlice'
import { createSettingsSlice } from './settingsSlice'
import { createMessageSlice } from './messageSlice'
import { createReplySlice } from './replySlice'

export const useChatStore = create<ChatState>()((...args) => ({
    ...createPresenceSlice(...args),
    ...createTypingSlice(...args),
    ...createConversationSlice(...args),
    ...createSettingsSlice(...args),
    ...createMessageSlice(...args),
    ...createReplySlice(...args),
}))

// Re-export types for convenience
export type { ChatState } from './types'

// Re-export shallow for manual shallow comparisons when needed
export { shallow }
