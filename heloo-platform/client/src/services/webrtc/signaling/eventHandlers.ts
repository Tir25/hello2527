/**
 * Event Handlers
 * 
 * Handles incoming signals and presence events.
 * @module services/webrtc/signaling/eventHandlers
 */

import { logger } from '@/lib/logger'
import type { RealtimePresenceState } from '@supabase/supabase-js'
import type { SignalingState } from './types'
import type { SignalPayload, PeerMetadata, RoomParticipant } from '@/types/webrtc'

/**
 * Handle incoming signal from broadcast
 */
export function handleIncomingSignal(state: SignalingState, payload: SignalPayload): void {
    if (state.isDestroyed) return

    if (!payload || !payload.type || !payload.senderId) {
        logger.warn('signaling:handleIncomingSignal', 'Received invalid signal', payload)
        return
    }

    // Skip own signals
    if (payload.senderId === state.currentUserId && !state.config.enableSelfBroadcast) {
        return
    }

    // Filter by target
    if (payload.targetId !== 'all' && payload.targetId !== state.currentUserId) {
        return
    }

    logger.debug('signaling:handleIncomingSignal', 'Received signal', {
        type: payload.type,
        senderId: payload.senderId,
    })

    if (state.onSignalCallback) {
        try {
            state.onSignalCallback(payload)
        } catch (error) {
            logger.error('signaling:handleIncomingSignal', 'Error in callback', error)
        }
    }
}

/**
 * Handle presence sync event
 */
export function handlePresenceSync(state: SignalingState): void {
    if (state.isDestroyed || !state.channel) return

    const presenceState = state.channel.presenceState<PeerMetadata>()
    updateParticipantsFromPresence(state, presenceState)

    if (state.onPresenceSyncCallback) {
        try {
            state.onPresenceSyncCallback(Array.from(state.participants.values()))
        } catch (error) {
            logger.error('signaling:handlePresenceSync', 'Error in callback', error)
        }
    }

    logger.info('signaling:handlePresenceSync', 'Presence synced', {
        participantCount: state.participants.size,
    })
}

/**
 * Handle presence join event
 */
export function handlePresenceJoin(
    state: SignalingState,
    key: string,
    newPresences: Array<{ [key: string]: unknown }>
): void {
    if (state.isDestroyed || key === state.currentUserId) return

    const presence = newPresences[0] as unknown as PeerMetadata | undefined
    if (!presence) return

    const participant: RoomParticipant = {
        userId: key,
        username: presence.username,
        avatarUrl: presence.avatarUrl,
        joinedAt: presence.joinedAt || Date.now(),
        metadata: presence,
    }

    state.participants.set(key, participant)
    updateRoomParticipants(state)

    logger.info('signaling:handlePresenceJoin', 'Peer joined', { peerId: key })

    if (state.onPeerJoinedCallback) {
        try {
            state.onPeerJoinedCallback(key, presence)
        } catch (error) {
            logger.error('signaling:handlePresenceJoin', 'Error in callback', error)
        }
    }
}

/**
 * Handle presence leave event
 */
export function handlePresenceLeave(
    state: SignalingState,
    key: string,
    _leftPresences: Array<{ [key: string]: unknown }>
): void {
    if (state.isDestroyed || key === state.currentUserId) return

    const participant = state.participants.get(key)
    if (!participant) return

    state.participants.delete(key)
    updateRoomParticipants(state)

    logger.info('signaling:handlePresenceLeave', 'Peer left', { peerId: key })

    if (state.onPeerLeftCallback) {
        try {
            state.onPeerLeftCallback(key)
        } catch (error) {
            logger.error('signaling:handlePresenceLeave', 'Error in callback', error)
        }
    }
}

function updateParticipantsFromPresence(
    state: SignalingState,
    presenceState: RealtimePresenceState<PeerMetadata>
): void {
    state.participants.clear()

    for (const [key, presences] of Object.entries(presenceState)) {
        if (key === state.currentUserId) continue

        const presence = presences[0] as PeerMetadata | undefined
        if (presence) {
            state.participants.set(key, {
                userId: key,
                username: presence.username,
                avatarUrl: presence.avatarUrl,
                joinedAt: presence.joinedAt || Date.now(),
                metadata: presence,
            })
        }
    }

    updateRoomParticipants(state)
}

function updateRoomParticipants(state: SignalingState): void {
    if (state.roomInfo) {
        state.roomInfo.participants = Array.from(state.participants.values())
    }
}
