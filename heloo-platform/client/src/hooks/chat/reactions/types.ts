/**
 * Reaction Types
 * 
 * Type definitions for message reactions.
 * @module hooks/chat/reactions/types
 */

import type { ReactionUpdateEvent } from '@/types/socket.types'

/**
 * Summary of reactions for a specific emoji on a message
 */
export interface ReactionSummary {
    emoji: string
    count: number
    hasReacted: boolean
    users: string[]
}

/**
 * Listener callback type for reaction updates
 */
export type ReactionListener = (event: ReactionUpdateEvent) => void

/**
 * Module-level state for reaction listeners
 */
export interface ReactionListenerState {
    listeners: Map<string, Set<ReactionListener>>
    isSocketInitialized: boolean
}
