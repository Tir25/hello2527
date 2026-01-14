/**
 * Reaction Socket Manager
 * 
 * Handles socket initialization and listener management
 * for real-time reaction updates.
 * 
 * @module hooks/chat/reactions/socketManager
 */

import { socketService } from '@/lib/services/socket.service'
import type { ReactionListener } from './types'
import type { ReactionUpdateEvent } from '@/types/socket.types'

// Module-level singleton state
const listeners = new Map<string, Set<ReactionListener>>()
let isSocketInitialized = false

/**
 * Initialize the single socket listener for all reactions
 * Uses singleton pattern - only initializes once
 */
export function initSocketListener(): void {
    if (isSocketInitialized) return

    socketService.onReactionUpdate((event: ReactionUpdateEvent) => {
        const messageListeners = listeners.get(event.messageId)
        if (messageListeners) {
            messageListeners.forEach(cb => cb(event))
        }
    })

    isSocketInitialized = true
}

/**
 * Register a listener for a specific message's reaction updates
 */
export function addReactionListener(messageId: string, callback: ReactionListener): void {
    if (!listeners.has(messageId)) {
        listeners.set(messageId, new Set())
    }
    listeners.get(messageId)!.add(callback)
}

/**
 * Unregister a listener for a specific message
 */
export function removeReactionListener(messageId: string, callback: ReactionListener): void {
    const set = listeners.get(messageId)
    if (set) {
        set.delete(callback)
        if (set.size === 0) {
            listeners.delete(messageId)
        }
    }
}

/**
 * Get listener count for a message (for debugging)
 */
export function getListenerCount(messageId: string): number {
    return listeners.get(messageId)?.size ?? 0
}
