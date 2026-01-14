/**
 * Reconnection Logic
 * 
 * Handles auto-reconnection with exponential backoff.
 * @module services/webrtc/signaling/reconnection
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { SignalingState } from './types'
import type { SignalingConnectionState, SignalingErrorCode, SignalingError } from '@/types/webrtc'
import { DEFAULT_RECONNECT_DELAY, DEFAULT_MAX_RECONNECT_ATTEMPTS } from './types'

/**
 * Create reconnection handler
 */
export function createReconnectionHandler(
    state: SignalingState,
    createChannelFn: () => Promise<void>,
    updateStateFn: (state: SignalingConnectionState) => void,
    handleErrorFn: (code: SignalingErrorCode, message: string, error?: unknown) => void
) {
    function attemptReconnect(): void {
        if (!state.currentRoomId || !state.currentUserId || state.isDestroyed) {
            return
        }

        state.reconnectAttempts++
        updateStateFn('reconnecting')

        const delay = Math.min(
            (state.config.reconnectDelayMs || DEFAULT_RECONNECT_DELAY) * Math.pow(2, state.reconnectAttempts - 1),
            30000
        )

        logger.info('signaling:attemptReconnect', 'Scheduling reconnect', {
            attempt: state.reconnectAttempts,
            delayMs: delay,
        })

        state.reconnectTimeout = setTimeout(async () => {
            if (state.isDestroyed) return

            try {
                await createChannelFn()
                logger.info('signaling:attemptReconnect', 'Reconnected successfully')
            } catch (error) {
                logger.error('signaling:attemptReconnect', 'Reconnect failed', error)

                const maxAttempts = state.config.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS
                if (state.reconnectAttempts < maxAttempts) {
                    attemptReconnect()
                } else {
                    handleErrorFn('CONNECTION_FAILED', 'Max reconnect attempts reached', error)
                    updateStateFn('error')
                }
            }
        }, delay)
    }

    function handleChannelClosed(): void {
        logger.warn('signaling:handleChannelClosed', 'Channel was closed')

        if (state.isDestroyed) {
            updateStateFn('disconnected')
            return
        }

        const maxAttempts = state.config.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS
        if (state.config.autoReconnect && state.reconnectAttempts < maxAttempts) {
            attemptReconnect()
        } else {
            updateStateFn('disconnected')
        }
    }

    return { attemptReconnect, handleChannelClosed }
}

/**
 * Clean up state on error
 */
export function cleanupState(state: SignalingState): void {
    if (state.reconnectTimeout) {
        clearTimeout(state.reconnectTimeout)
        state.reconnectTimeout = null
    }

    if (state.channel) {
        supabase.removeChannel(state.channel).catch(err => {
            logger.warn('signaling:cleanupState', 'Failed to remove channel', err)
        })
        state.channel = null
    }

    state.currentUserId = null
    state.currentRoomId = null
    state.roomInfo = null
    state.participants.clear()
    state.connectedAt = null
    state.reconnectAttempts = 0
    state.peerMetadata = {}
    state.connectionState = 'disconnected'
}

/**
 * Update connection state and notify callback
 */
export function updateConnectionState(
    state: SignalingState,
    newState: SignalingConnectionState,
    getConnectionInfo: () => { state: SignalingConnectionState; roomId: string | null; userId: string | null; connectedAt: number | null; lastError: Error | null; reconnectAttempts: number }
): void {
    const previousState = state.connectionState
    state.connectionState = newState

    if (newState === 'error' || newState === 'disconnected') {
        state.connectedAt = null
    }

    logger.debug('signaling:updateConnectionState', 'State changed', {
        from: previousState,
        to: newState,
    })

    if (state.onConnectionStateChangeCallback) {
        try {
            state.onConnectionStateChangeCallback(newState, getConnectionInfo())
        } catch (error) {
            logger.error('signaling:updateConnectionState', 'Error in callback', error)
        }
    }
}

/**
 * Handle and log errors
 */
export function handleError(
    state: SignalingState,
    code: SignalingErrorCode,
    message: string,
    originalError?: unknown
): void {
    const error = new Error(message) as SignalingError
    error.name = 'SignalingError'
    error.code = code
    error.details = { originalError }

    state.lastError = error

    logger.error('signaling:error', message, { code, originalError })

    if (state.onErrorCallback) {
        try {
            state.onErrorCallback(error)
        } catch (callbackError) {
            logger.error('signaling:handleError', 'Error in callback', callbackError)
        }
    }
}
