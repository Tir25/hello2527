/**
 * VideoGrid Component
 * 
 * Handles the CSS Grid layout for video tiles in a call.
 * Automatically adapts grid from 1x1 to NxN based on participant count.
 * 
 * @module components/call/grid/VideoGrid
 */

import { memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { VideoTile } from '../VideoTile'
import type { PeerConnection } from '@/hooks/call/peerMesh'

export interface VideoGridProps {
    /** Local media stream */
    localStream: MediaStream | null
    /** Array of peer connections */
    peers: PeerConnection[]
    /** Current user's display name */
    localName?: string
    /** Current user's avatar URL */
    localAvatarUrl?: string
    /** Whether local audio is muted */
    isLocalAudioMuted?: boolean
    /** Whether local video is off */
    isLocalVideoOff?: boolean
}

/**
 * Calculate grid layout based on participant count
 */
/**
 * Calculate grid layout based on participant count and screen orientation
 * For mobile (portrait), we typically want fewer columns
 */
function getGridLayout(count: number, isMobilePortrait: boolean): { cols: number; rows: number } {
    if (count <= 1) return { cols: 1, rows: 1 }

    // Portrait mode adjustments
    if (isMobilePortrait) {
        if (count === 2) return { cols: 1, rows: 2 } // Stack verticallly
        if (count <= 4) return { cols: 2, rows: 2 }
        if (count <= 6) return { cols: 2, rows: 3 }
        if (count <= 9) return { cols: 3, rows: 3 }
    }

    // Landscape / Desktop defaults
    if (count === 2) return { cols: 2, rows: 1 }
    if (count <= 4) return { cols: 2, rows: 2 }
    if (count <= 6) return { cols: 3, rows: 2 }
    if (count <= 9) return { cols: 3, rows: 3 }

    // For larger numbers, prefer wider layout
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    return { cols, rows }
}

/**
 * VideoGrid - Displays all video tiles in a responsive grid
 */
export const VideoGrid = memo(function VideoGrid({
    localStream,
    peers,
    localName = 'You',
    localAvatarUrl,
    isLocalAudioMuted = false,
    isLocalVideoOff = false,
}: VideoGridProps) {
    // Total participant count (including self)
    const participantCount = 1 + peers.length

    // Simple reactive screen orientation check
    const isPortrait = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false

    // Calculate grid layout
    const { cols } = useMemo(() => getGridLayout(participantCount, isPortrait), [participantCount, isPortrait])

    // Grid style
    const gridStyle = useMemo(() => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '8px',
        height: '100%',
        width: '100%',
        padding: '8px',
        // On mobile, add padding for bottom controls
        paddingBottom: isPortrait ? '80px' : '8px'
    }), [cols, isPortrait])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 p-2 sm:p-4"
            style={gridStyle}
        >
            <AnimatePresence mode="popLayout">
                {/* Local video tile */}
                <VideoTile
                    key="local"
                    peerId="local"
                    stream={localStream}
                    name={localName}
                    avatarUrl={localAvatarUrl}
                    isLocal={true}
                    isMuted={isLocalAudioMuted}
                    isVideoOff={isLocalVideoOff}
                    mirror={true}
                />

                {/* Remote peer video tiles */}
                {peers.map((peerConnection) => (
                    <VideoTile
                        key={peerConnection.peerId}
                        peerId={peerConnection.peerId}
                        stream={peerConnection.stream}
                        name={peerConnection.metadata?.username}
                        avatarUrl={peerConnection.metadata?.avatarUrl}
                        isLocal={false}
                        isMuted={peerConnection.metadata?.isMuted}
                        isVideoOff={peerConnection.metadata?.isVideoOff}
                        mirror={false}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    )
})

export default VideoGrid
