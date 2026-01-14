/**
 * usePeerMesh Hook
 * 
 * Manages the WebRTC peer mesh - creating, tracking, and destroying
 * SimplePeer connections for multi-party video calls.
 * 
 * @module hooks/call/peerMesh
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import SimplePeer from 'simple-peer'
import { logger } from '@/lib/logger'
import type { SignalPayload } from '@/types/webrtc'
import type { PeerConnection, UsePeerMeshOptions, UsePeerMeshReturn } from './types'
import { DEFAULT_ICE_SERVERS, MAX_PENDING_SIGNALS } from './config'

export function usePeerMesh(options: UsePeerMeshOptions): UsePeerMeshReturn {
    const { localStream, onSignal, onStream, onConnect, onClose, onError } = options

    // State
    const [peers, setPeers] = useState<PeerConnection[]>([])

    // Refs for synchronous access
    const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map())
    const isCleaningUpRef = useRef(false)
    const isMountedRef = useRef(true)
    const pendingSignalsRef = useRef<Map<string, SignalPayload[]>>(new Map())

    // Store callbacks in refs to avoid stale closures
    const onSignalRef = useRef(onSignal)
    const onStreamRef = useRef(onStream)
    const onConnectRef = useRef(onConnect)
    const onCloseRef = useRef(onClose)
    const onErrorRef = useRef(onError)

    // Update callback refs
    useEffect(() => { onSignalRef.current = onSignal }, [onSignal])
    useEffect(() => { onStreamRef.current = onStream }, [onStream])
    useEffect(() => { onConnectRef.current = onConnect }, [onConnect])
    useEffect(() => { onCloseRef.current = onClose }, [onClose])
    useEffect(() => { onErrorRef.current = onError }, [onError])

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true
        return () => { isMountedRef.current = false }
    }, [])

    // Clean up a specific peer
    const cleanupPeer = useCallback((peerId: string) => {
        const peer = peersRef.current.get(peerId)
        if (peer) {
            logger.debug('usePeerMesh:cleanupPeer', 'Destroying peer', { peerId })
            try { peer.destroy() } catch { /* Ignore */ }
            peersRef.current.delete(peerId)
        }
        if (isMountedRef.current) {
            setPeers(prev => prev.filter(p => p.peerId !== peerId))
        }
    }, [])

    // Remove a peer and notify
    const removePeer = useCallback((peerId: string) => {
        cleanupPeer(peerId)
        onCloseRef.current?.(peerId)
    }, [cleanupPeer])

    // Create a new peer connection
    const createPeer = useCallback((
        targetPeerId: string,
        initiator: boolean,
        stream?: MediaStream,
        incomingSignal?: SimplePeer.SignalData
    ): SimplePeer.Instance | null => {
        if (peersRef.current.has(targetPeerId)) {
            cleanupPeer(targetPeerId)
        }

        const streamToUse = stream || localStream
        if (!streamToUse) {
            logger.warn('usePeerMesh:createPeer', 'No stream available')
            return null
        }

        logger.info('usePeerMesh:createPeer', 'Creating peer', { targetPeerId, initiator })

        const peer = new SimplePeer({
            initiator,
            stream: streamToUse,
            trickle: true,
            config: { iceServers: DEFAULT_ICE_SERVERS },
        })

        peersRef.current.set(targetPeerId, peer)

        // Handle signal generation
        peer.on('signal', (data: SimplePeer.SignalData) => {
            logger.debug('usePeerMesh:signal', 'Got signal', { targetPeerId, type: data.type || 'candidate' })
            onSignalRef.current(targetPeerId, data)
        })

        // Handle remote stream
        peer.on('stream', (remoteStream: MediaStream) => {
            logger.info('usePeerMesh:stream', 'Received stream', { targetPeerId })
            if (isMountedRef.current) {
                setPeers(prev => {
                    const existing = prev.find(p => p.peerId === targetPeerId)
                    if (existing) {
                        return prev.map(p => p.peerId === targetPeerId ? { ...p, stream: remoteStream } : p)
                    }
                    return [...prev, { peerId: targetPeerId, peer, stream: remoteStream }]
                })
            }
            onStreamRef.current?.(targetPeerId, remoteStream)
        })

        // Handle connection
        peer.on('connect', () => {
            logger.info('usePeerMesh:connect', 'Peer connected', { targetPeerId })
            onConnectRef.current?.(targetPeerId)
        })

        // Handle close
        peer.on('close', () => {
            logger.info('usePeerMesh:close', 'Peer closed', { targetPeerId })
            cleanupPeer(targetPeerId)
            onCloseRef.current?.(targetPeerId)
        })

        // Handle error
        peer.on('error', (err: Error) => {
            logger.error('usePeerMesh:error', 'Peer error', { targetPeerId, error: err.message })
            cleanupPeer(targetPeerId)
            onErrorRef.current?.(targetPeerId, err)
        })

        // Add to state
        if (isMountedRef.current) {
            setPeers(prev => prev.some(p => p.peerId === targetPeerId) ? prev : [...prev, { peerId: targetPeerId, peer, stream: null }])
        }

        // Process incoming signal
        if (incomingSignal) {
            try { peer.signal(incomingSignal) } catch (e) {
                logger.error('usePeerMesh:createPeer', 'Failed to process signal', e)
            }
        }

        // Process pending signals
        const pending = pendingSignalsRef.current.get(targetPeerId)
        if (pending?.length) {
            pending.forEach(signal => {
                try { if (signal.signalData) peer.signal(signal.signalData as SimplePeer.SignalData) } catch { /* Ignore */ }
            })
            pendingSignalsRef.current.delete(targetPeerId)
        }

        return peer
    }, [localStream, cleanupPeer])

    // Signal an existing peer
    const signalPeer = useCallback((peerId: string, signalData: SimplePeer.SignalData): boolean => {
        const peer = peersRef.current.get(peerId)
        if (peer) {
            try { peer.signal(signalData); return true } catch { return false }
        }
        // Store as pending
        const pending = pendingSignalsRef.current.get(peerId) || []
        if (pending.length < MAX_PENDING_SIGNALS) {
            pending.push({ signalData } as unknown as SignalPayload)
            pendingSignalsRef.current.set(peerId, pending)
        }
        return false
    }, [])

    const hasPeer = useCallback((peerId: string) => peersRef.current.has(peerId), [])
    const getPeer = useCallback((peerId: string) => peersRef.current.get(peerId), [])
    const getPeersRef = useCallback(() => peersRef.current, [])

    // Destroy all peers
    const destroyAllPeers = useCallback(() => {
        if (isCleaningUpRef.current) return
        isCleaningUpRef.current = true

        logger.info('usePeerMesh:destroyAllPeers', 'Destroying all', { count: peersRef.current.size })
        peersRef.current.forEach(peer => { try { peer.destroy() } catch { /* Ignore */ } })
        peersRef.current.clear()
        pendingSignalsRef.current.clear()
        if (isMountedRef.current) setPeers([])

        isCleaningUpRef.current = false
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            peersRef.current.forEach(peer => { try { peer.destroy() } catch { /* Ignore */ } })
            peersRef.current.clear()
        }
    }, [])

    return { peers, createPeer, signalPeer, hasPeer, getPeer, removePeer, destroyAllPeers, getPeersRef }
}
