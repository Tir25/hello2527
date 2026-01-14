/**
 * VideoTile Component
 * 
 * A reusable video tile component for displaying participant video streams
 * with glass morphism design.
 * 
 * Features:
 * - Video stream display with object-fit cover
 * - Muted indicator icon
 * - Name label (glass pill at bottom left)
 * - Avatar fallback when camera is off
 * - Smooth animations and transitions
 * 
 * @module components/call/VideoTile
 */

import { useRef, useEffect, memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, VideoOff, User } from 'lucide-react'

export interface VideoTileProps {
    /** Unique identifier for the participant */
    peerId: string
    /** MediaStream to display */
    stream: MediaStream | null
    /** Display name of the participant */
    name?: string
    /** Avatar URL for the participant */
    avatarUrl?: string
    /** Whether this is the local user's tile */
    isLocal?: boolean
    /** Whether audio is muted */
    isMuted?: boolean
    /** Whether video is off */
    isVideoOff?: boolean
    /** Whether this tile should be mirrored (for local preview) */
    mirror?: boolean
    /** Optional click handler */
    onClick?: () => void
}

/**
 * VideoTile - Individual participant video display
 */
export const VideoTile = memo(function VideoTile({
    peerId,
    stream,
    name,
    avatarUrl,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    mirror = false,
    onClick,
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Attach stream to video element
    useEffect(() => {
        const video = videoRef.current
        if (video && stream) {
            video.srcObject = stream
        }

        // Cleanup srcObject when stream changes or component unmounts
        return () => {
            if (video) {
                video.srcObject = null
            }
        }
    }, [stream])

    // Memoize video track state to avoid expensive checks on every render
    const showVideo = useMemo(() => {
        if (!stream || isVideoOff) return false
        const videoTracks = stream.getVideoTracks()
        return videoTracks.length > 0 && videoTracks[0]?.enabled === true
    }, [stream, isVideoOff])

    const displayName = name || (isLocal ? 'You' : 'Participant')

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/95 group cursor-pointer"
            onClick={onClick}
            data-peer-id={peerId}
        >
            {/* Video Element - Always rendered to maintain ref, hidden when not showing */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Always mute local video to prevent echo
                className={`absolute inset-0 w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''
                    } ${showVideo ? '' : 'hidden'}`}
            />

            {/* Avatar Fallback - shown when video is not displayed */}
            {!showVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20"
                        />
                    ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                            <User className="w-12 h-12 sm:w-16 sm:h-16 text-white/60" />
                        </div>
                    )}
                </div>
            )}

            {/* Video Off Indicator Overlay */}
            {isVideoOff && stream && (
                <div className="absolute top-4 right-4">
                    <div className="p-2 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30">
                        <VideoOff className="w-4 h-4 text-red-400" />
                    </div>
                </div>
            )}

            {/* Gradient Overlay for Name Label */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Name Label (Glass Pill) */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                    {/* Mute Indicator */}
                    {isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                        <Mic className="w-3.5 h-3.5 text-green-400" />
                    )}

                    {/* Name */}
                    <span className="text-sm font-medium text-white truncate max-w-[120px]">
                        {displayName}
                    </span>
                </div>
            </div>

            {/* Speaking Indicator Ring */}
            {!isMuted && stream && (
                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-green-400/0 pointer-events-none"
                    animate={{
                        borderColor: ['rgba(74, 222, 128, 0)', 'rgba(74, 222, 128, 0.5)', 'rgba(74, 222, 128, 0)'],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </motion.div>
    )
})

export default VideoTile

