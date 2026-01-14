/**
 * Personal Channel Management
 * 
 * Handles personal signaling channel for incoming calls.
 * @module services/webrtc/signaling/personalChannel
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { SignalingState, IncomingCallPayload, CallCancelledPayload } from './types'
import { PERSONAL_CHANNEL_PREFIX, PRESENCE_SYNC_TIMEOUT } from './types'
import { createSignalingError } from './createError'

/**
 * Initialize personal signaling channel
 */
export async function initializePersonalChannel(
    state: SignalingState,
    userId: string
): Promise<void> {
    if (!userId) {
        throw createSignalingError('INVALID_SIGNAL', 'User ID is required for initialization')
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
        throw createSignalingError('INVALID_SIGNAL', 'User ID contains invalid characters')
    }

    if (state.personalChannel && state.personalUserId === userId) {
        logger.debug('signaling:initialize', 'Already initialized for user', { userId })
        return
    }

    if (state.personalChannel) {
        await cleanupPersonalChannel(state)
    }

    state.personalUserId = userId
    const channelName = `${PERSONAL_CHANNEL_PREFIX}${userId}`

    logger.info('signaling:initialize', 'Creating personal channel', { channelName })

    state.personalChannel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
    })

    state.personalChannel.on('broadcast', { event: 'incoming_call' }, (payload) => {
        handleIncomingCallBroadcast(state, payload.payload as IncomingCallPayload)
    })

    state.personalChannel.on('broadcast', { event: 'call_cancelled' }, (payload) => {
        handleCallCancelledBroadcast(state, payload.payload as CallCancelledPayload)
    })

    await new Promise<void>((resolve, reject) => {
        let hasResolved = false
        const timeout = setTimeout(() => {
            if (!hasResolved) {
                hasResolved = true
                reject(createSignalingError('CONNECTION_FAILED', 'Personal channel subscription timed out'))
            }
        }, PRESENCE_SYNC_TIMEOUT)

        state.personalChannel!.subscribe((status) => {
            if (hasResolved) return

            if (status === 'SUBSCRIBED') {
                clearTimeout(timeout)
                hasResolved = true
                logger.info('signaling:initialize', 'Personal channel ready', { userId })
                resolve()
            } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
                clearTimeout(timeout)
                hasResolved = true
                reject(createSignalingError('CHANNEL_ERROR', `Personal channel failed: ${status}`))
            }
        })
    })
}

function handleIncomingCallBroadcast(state: SignalingState, payload: IncomingCallPayload): void {
    if (state.isDestroyed) return

    logger.info('signaling:handleIncomingCall', 'Received incoming call', {
        from: payload.caller.name,
        roomId: payload.roomId,
    })

    if (state.onIncomingCallCallback) {
        try {
            state.onIncomingCallCallback(payload)
        } catch (error) {
            logger.error('signaling:handleIncomingCall', 'Error in callback', error)
        }
    }
}

function handleCallCancelledBroadcast(state: SignalingState, payload: CallCancelledPayload): void {
    if (state.isDestroyed) return

    logger.info('signaling:handleCallCancelled', 'Call was cancelled', {
        roomId: payload.roomId,
        reason: payload.reason,
    })

    if (state.onCallCancelledCallback) {
        try {
            state.onCallCancelledCallback(payload)
        } catch (error) {
            logger.error('signaling:handleCallCancelled', 'Error in callback', error)
        }
    }
}

export async function cleanupPersonalChannel(state: SignalingState): Promise<void> {
    if (state.personalChannel) {
        try {
            await supabase.removeChannel(state.personalChannel)
        } catch (error) {
            logger.warn('signaling:cleanupPersonalChannel', 'Failed to remove channel', error)
        }
        state.personalChannel = null
    }
    state.personalUserId = null
    state.onIncomingCallCallback = null
}

/**
 * Call a user by sending incoming_call broadcast
 */
export async function callUser(
    targetUserId: string,
    roomId: string,
    caller: { id: string; name: string; avatar?: string },
    isGroup: boolean,
    isVideo: boolean
): Promise<void> {
    if (!targetUserId) {
        throw createSignalingError('INVALID_SIGNAL', 'Target user ID is required')
    }

    const channelName = `${PERSONAL_CHANNEL_PREFIX}${targetUserId}`
    logger.info('signaling:callUser', 'Sending incoming call', { targetUserId, roomId })

    const tempChannel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
    })

    await new Promise<void>((resolve, reject) => {
        let hasResolved = false
        const timeout = setTimeout(() => {
            if (!hasResolved) {
                hasResolved = true
                supabase.removeChannel(tempChannel).catch(() => { })
                reject(createSignalingError('SEND_FAILED', 'Call notification timed out'))
            }
        }, 5000)

        tempChannel.subscribe(async (status) => {
            if (hasResolved) return

            if (status === 'SUBSCRIBED') {
                clearTimeout(timeout)
                try {
                    const payload: IncomingCallPayload = {
                        type: 'incoming_call',
                        roomId,
                        caller,
                        isGroup,
                        isVideo,
                        timestamp: Date.now(),
                    }

                    const result = await tempChannel.send({
                        type: 'broadcast',
                        event: 'incoming_call',
                        payload,
                    })

                    if (result !== 'ok') throw new Error(`Broadcast failed: ${result}`)

                    hasResolved = true
                    resolve()
                } catch (error) {
                    hasResolved = true
                    reject(error)
                } finally {
                    await supabase.removeChannel(tempChannel)
                }
            } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
                clearTimeout(timeout)
                hasResolved = true
                supabase.removeChannel(tempChannel).catch(() => { })
                reject(createSignalingError('SEND_FAILED', `Failed to send call: ${status}`))
            }
        })
    })
}

/**
 * Cancel a call
 */
export async function cancelCall(
    targetUserId: string,
    roomId: string,
    reason: 'caller_ended' | 'declined' | 'timeout'
): Promise<void> {
    if (!targetUserId) {
        logger.warn('signaling:cancelCall', 'No target user ID provided')
        return
    }

    const channelName = `${PERSONAL_CHANNEL_PREFIX}${targetUserId}`
    const tempChannel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
    })

    try {
        await new Promise<void>((resolve) => {
            let hasResolved = false
            const timeout = setTimeout(() => {
                if (!hasResolved) {
                    hasResolved = true
                    supabase.removeChannel(tempChannel).catch(() => { })
                    resolve()
                }
            }, 3000)

            tempChannel.subscribe(async (status) => {
                if (hasResolved) return

                if (status === 'SUBSCRIBED') {
                    try {
                        const payload: CallCancelledPayload = {
                            type: 'call_cancelled',
                            roomId,
                            reason,
                            timestamp: Date.now(),
                        }

                        await tempChannel.send({
                            type: 'broadcast',
                            event: 'call_cancelled',
                            payload,
                        })

                        clearTimeout(timeout)
                        hasResolved = true
                        resolve()
                    } catch {
                        clearTimeout(timeout)
                        hasResolved = true
                        resolve()
                    } finally {
                        await supabase.removeChannel(tempChannel)
                    }
                } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
                    clearTimeout(timeout)
                    hasResolved = true
                    supabase.removeChannel(tempChannel).catch(() => { })
                    resolve()
                }
            })
        })
    } catch (error) {
        logger.error('signaling:cancelCall', 'Error sending cancellation', error)
    }
}
