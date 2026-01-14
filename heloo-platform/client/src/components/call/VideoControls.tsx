/**
 * VideoControls Component
 * 
 * Floating glass dock with call control buttons.
 * 
 * Features:
 * - Toggle Microphone
 * - Toggle Camera
 * - Switch Camera (Mobile only)
 * - Toggle Screen Share
 * - End Call
 * - Glass morphism design with smooth animations
 * 
 * @module components/call/VideoControls
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Monitor,
    MonitorOff,
    SwitchCamera,
} from 'lucide-react'

export interface VideoControlsProps {
    /** Whether microphone is muted */
    isAudioMuted: boolean
    /** Whether camera is off */
    isVideoMuted: boolean
    /** Whether screen sharing is active */
    isScreenSharing: boolean
    /** Handler for toggle audio */
    onToggleAudio: () => void
    /** Handler for toggle video */
    onToggleVideo: () => void
    /** Handler for toggle screen share */
    onToggleScreenShare: () => Promise<void>
    /** Handler for end call */
    onEndCall: () => Promise<void>
    /** Handler for switch camera */
    onSwitchCamera?: () => Promise<void>
    /** Whether we're on mobile (shows switch camera button) */
    isMobile?: boolean
}

/**
 * Control Button Component
 */
interface ControlButtonProps {
    icon: React.ReactNode
    label: string
    onClick: () => void
    variant?: 'default' | 'danger' | 'active'
    disabled?: boolean
}

const ControlButton = memo(function ControlButton({
    icon,
    label,
    onClick,
    variant = 'default',
    disabled = false,
}: ControlButtonProps) {
    const baseClasses = 'relative flex flex-col items-center justify-center gap-1 p-3 sm:p-4 rounded-2xl transition-all duration-200 touch-target'

    const variantClasses = {
        default: 'bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white',
        danger: 'bg-red-500/80 hover:bg-red-500 active:bg-red-600 border border-red-400/50 text-white',
        active: 'bg-purple-500/80 hover:bg-purple-500 active:bg-purple-600 border border-purple-400/50 text-white',
    }

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={label}
        >
            <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-xs font-medium hidden sm:block">{label}</span>
        </motion.button>
    )
})

/**
 * VideoControls - Floating control dock
 */
export const VideoControls = memo(function VideoControls({
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onEndCall,
    onSwitchCamera,
    isMobile = false,
}: VideoControlsProps) {
    const [isEndingCall, setIsEndingCall] = useState(false)
    const [isTogglingScreenShare, setIsTogglingScreenShare] = useState(false)

    // Use refs to avoid stale closure issues in async handlers
    const isEndingCallRef = useRef(false)
    const isTogglingScreenShareRef = useRef(false)
    const isMountedRef = useRef(true)

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Handle end call with loading state
    const handleEndCall = useCallback(async () => {
        if (isEndingCallRef.current) return
        isEndingCallRef.current = true
        setIsEndingCall(true)
        try {
            await onEndCall()
        } finally {
            isEndingCallRef.current = false
            if (isMountedRef.current) {
                setIsEndingCall(false)
            }
        }
    }, [onEndCall])

    // Handle screen share with loading state
    const handleToggleScreenShare = useCallback(async () => {
        if (isTogglingScreenShareRef.current) return
        isTogglingScreenShareRef.current = true
        setIsTogglingScreenShare(true)
        try {
            await onToggleScreenShare()
        } finally {
            isTogglingScreenShareRef.current = false
            if (isMountedRef.current) {
                setIsTogglingScreenShare(false)
            }
        }
    }, [onToggleScreenShare])

    // Handle switch camera (mobile only)
    const handleSwitchCamera = useCallback(async () => {
        if (onSwitchCamera) {
            await onSwitchCamera()
        }
    }, [onSwitchCamera])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 safe-bottom"
        >
            {/* Glass Dock Container */}
            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                {/* Toggle Microphone */}
                <ControlButton
                    icon={isAudioMuted ? <MicOff className="w-full h-full" /> : <Mic className="w-full h-full" />}
                    label={isAudioMuted ? 'Unmute' : 'Mute'}
                    onClick={onToggleAudio}
                    variant={isAudioMuted ? 'active' : 'default'}
                />

                {/* Toggle Camera */}
                <ControlButton
                    icon={isVideoMuted ? <VideoOff className="w-full h-full" /> : <Video className="w-full h-full" />}
                    label={isVideoMuted ? 'Start Video' : 'Stop Video'}
                    onClick={onToggleVideo}
                    variant={isVideoMuted ? 'active' : 'default'}
                />

                {/* Switch Camera (Mobile Only) */}
                {isMobile && (
                    <ControlButton
                        icon={<SwitchCamera className="w-full h-full" />}
                        label="Switch"
                        onClick={handleSwitchCamera}
                    />
                )}

                {/* Screen Share (Desktop Only) */}
                {!isMobile && (
                    <ControlButton
                        icon={isScreenSharing ? <MonitorOff className="w-full h-full" /> : <Monitor className="w-full h-full" />}
                        label={isScreenSharing ? 'Stop Share' : 'Share'}
                        onClick={handleToggleScreenShare}
                        variant={isScreenSharing ? 'active' : 'default'}
                        disabled={isTogglingScreenShare}
                    />
                )}

                {/* Divider */}
                <div className="w-px h-10 bg-white/20 mx-1 sm:mx-2" />

                {/* End Call */}
                <ControlButton
                    icon={<PhoneOff className="w-full h-full" />}
                    label="End"
                    onClick={handleEndCall}
                    variant="danger"
                    disabled={isEndingCall}
                />
            </div>
        </motion.div>
    )
})

export default VideoControls
