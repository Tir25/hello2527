/**
 * WebRTC Configuration
 * 
 * ICE server configuration and WebRTC defaults.
 * @module hooks/call/peerMesh/config
 */

/**
 * Default ICE servers for WebRTC connections
 */
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
]

/**
 * Maximum pending signals to store per peer
 */
export const MAX_PENDING_SIGNALS = 50

/**
 * Create SimplePeer configuration
 */
export function createPeerConfig(stream: MediaStream): {
    initiator: boolean
    stream: MediaStream
    trickle: boolean
    config: RTCConfiguration
} {
    return {
        initiator: false, // Will be overridden
        stream,
        trickle: true,
        config: {
            iceServers: DEFAULT_ICE_SERVERS,
        },
    }
}
