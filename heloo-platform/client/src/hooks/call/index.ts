/**
 * Call Hooks Module
 * 
 * Exports all call-related hooks for video calling functionality.
 * 
 * @module hooks/call
 */

export { useLocalStream, type UseLocalStreamReturn, type UseLocalStreamOptions } from './useLocalStream'
export { usePeerMesh, type UsePeerMeshReturn, type UsePeerMeshOptions, type PeerConnection } from './peerMesh'
export { useCallSignaling, type UseCallSignalingReturn, type UseCallSignalingOptions, type IncomingCall } from './useCallSignaling'
