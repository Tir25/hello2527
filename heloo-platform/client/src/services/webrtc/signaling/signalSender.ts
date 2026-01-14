/**
 * Signal Sending
 * 
 * Handles sending signals to peers.
 * @module services/webrtc/signaling/signalSender
 */

import { logger } from '@/lib/logger'
import type { SignalingState } from './types'
import type { SignalPayload, SignalType } from '@/types/webrtc'
import { createSignalingError } from './createError'

/**
 * Send a signal to peers
 */
export async function sendSignal(
    state: SignalingState,
    payload: Omit<SignalPayload, 'timestamp'>
): Promise<void> {
    if (state.isDestroyed) {
        throw createSignalingError('CHANNEL_ERROR', 'Service has been destroyed')
    }

    if (!state.channel || state.connectionState !== 'connected') {
        throw createSignalingError('NOT_CONNECTED', 'Not connected to a room')
    }

    const fullPayload: SignalPayload = {
        ...payload,
        timestamp: Date.now(),
    }

    const result = await state.channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: fullPayload,
    })

    if (result !== 'ok') {
        throw createSignalingError('SEND_FAILED', `Failed to send signal: ${result}`)
    }

    logger.debug('signaling:sendSignal', 'Signal sent', {
        type: payload.type,
        targetId: payload.targetId,
    })
}

/**
 * Send a signal to a specific peer
 */
export async function sendSignalToPeer(
    state: SignalingState,
    peerId: string,
    type: SignalType,
    signalData: SignalPayload['signalData']
): Promise<void> {
    if (!state.currentUserId || !state.currentRoomId) {
        throw createSignalingError('NOT_CONNECTED', 'Not connected to a room')
    }

    await sendSignal(state, {
        type,
        senderId: state.currentUserId,
        targetId: peerId,
        roomId: state.currentRoomId,
        signalData,
        isGroup: state.roomInfo?.isGroupCall,
        groupId: state.roomInfo?.groupId,
    })
}

/**
 * Broadcast a signal to all peers
 */
export async function broadcastSignal(
    state: SignalingState,
    type: SignalType,
    signalData: SignalPayload['signalData']
): Promise<void> {
    if (!state.currentUserId || !state.currentRoomId) {
        throw createSignalingError('NOT_CONNECTED', 'Not connected to a room')
    }

    await sendSignal(state, {
        type,
        senderId: state.currentUserId,
        targetId: 'all',
        roomId: state.currentRoomId,
        signalData,
        isGroup: state.roomInfo?.isGroupCall,
        groupId: state.roomInfo?.groupId,
    })
}
