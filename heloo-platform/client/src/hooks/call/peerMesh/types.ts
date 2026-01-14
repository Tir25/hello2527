/**
 * Peer Mesh Types
 * 
 * Type definitions for WebRTC peer mesh management.
 * @module hooks/call/peerMesh/types
 */

import SimplePeer from 'simple-peer'
import type { PeerMetadata } from '@/types/webrtc'

/**
 * Peer connection state
 */
export interface PeerConnection {
    peerId: string
    peer: SimplePeer.Instance
    stream: MediaStream | null
    metadata?: PeerMetadata
}

/**
 * Options for usePeerMesh hook
 */
export interface UsePeerMeshOptions {
    /** Current user ID */
    userId: string | null
    /** Local media stream to share */
    localStream: MediaStream | null
    /** Callback when peer generates a signal to send */
    onSignal: (peerId: string, signalData: SimplePeer.SignalData) => void
    /** Callback when remote stream is received */
    onStream?: (peerId: string, stream: MediaStream) => void
    /** Callback when peer connection is established */
    onConnect?: (peerId: string) => void
    /** Callback when peer connection is closed */
    onClose?: (peerId: string) => void
    /** Callback when peer connection errors */
    onError?: (peerId: string, error: Error) => void
}

/**
 * Return type for usePeerMesh hook
 */
export interface UsePeerMeshReturn {
    /** Array of connected peers */
    peers: PeerConnection[]
    /** Create a new peer connection */
    createPeer: (
        targetPeerId: string,
        initiator: boolean,
        stream?: MediaStream,
        incomingSignal?: SimplePeer.SignalData
    ) => SimplePeer.Instance | null
    /** Signal an existing peer */
    signalPeer: (peerId: string, signalData: SimplePeer.SignalData) => boolean
    /** Check if peer exists */
    hasPeer: (peerId: string) => boolean
    /** Get a specific peer */
    getPeer: (peerId: string) => SimplePeer.Instance | undefined
    /** Remove a specific peer */
    removePeer: (peerId: string) => void
    /** Destroy all peers */
    destroyAllPeers: () => void
    /** Get peers ref for synchronous access */
    getPeersRef: () => Map<string, SimplePeer.Instance>
}
