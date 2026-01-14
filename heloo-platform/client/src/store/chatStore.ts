/**
 * Chat Store - Backward Compatibility Export
 * 
 * This file re-exports from the new modular location.
 * All code has been refactored into:
 * - /store/chat/types.ts (~90 lines)
 * - /store/chat/presenceSlice.ts (~55 lines)
 * - /store/chat/typingSlice.ts (~50 lines)
 * - /store/chat/conversationSlice.ts (~150 lines)
 * - /store/chat/messageSlice.ts (~200 lines)
 * - /store/chat/index.ts (~30 lines)
 * 
 * Total: ~575 lines split into 6 files, all under 200 lines each.
 */

export { useChatStore } from './chat'
export type { ChatState } from './chat'
