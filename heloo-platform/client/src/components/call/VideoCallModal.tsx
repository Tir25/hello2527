/**
 * VideoCallModal Component
 * 
 * The main container for video calling functionality.
 * Conditionally renders either the active call view or the incoming call modal.
 * 
 * @module components/call/VideoCallModal
 */

import { memo, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallContext, type CallStatus } from '@/context/call'
import { VideoGrid } from './grid/VideoGrid'
import { IncomingCallModal } from './modals/IncomingCallModal'
import { VideoControls } from './VideoControls'
import { useAuthStore } from '@/store/authStore'

/**
 * Check if we should show the call UI
 */
function shouldShowCallUI(status: CallStatus): boolean {
    return status !== 'idle'
}

/**
 * Check if we should show the active call view with video grid
 */
function shouldShowActiveCall(status: CallStatus): boolean {
    return status === 'calling' || status === 'connecting' || status === 'connected'
}

/**
 * VideoCallModal - Main video call container
 */
export const VideoCallModal = memo(function VideoCallModal() {
    const {
        callStatus,
        myStream,
        peers,
        incomingCall,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        switchCamera,
        answerCall,
        declineCall,
    } = useCallContext()

    const { profile } = useAuthStore()
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Handlers
    const handleEndCall = useCallback(async () => {
        await endCall()
    }, [endCall])

    const handleToggleScreenShare = useCallback(async () => {
        await toggleScreenShare()
    }, [toggleScreenShare])

    const handleAnswerCall = useCallback(async () => {
        await answerCall()
    }, [answerCall])

    const handleDeclineCall = useCallback(async () => {
        await declineCall()
    }, [declineCall])

    // Don't render anything if not in a call
    if (!shouldShowCallUI(callStatus)) {
        return null
    }

    // Show incoming call modal
    if (callStatus === 'receiving' && incomingCall) {
        return (
            <IncomingCallModal
                incomingCall={incomingCall}
                onAnswer={handleAnswerCall}
                onDecline={handleDeclineCall}
            />
        )
    }

    // Show active call view
    if (shouldShowActiveCall(callStatus)) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-gray-900"
                >
                    {/* Video Grid */}
                    <VideoGrid
                        localStream={myStream}
                        peers={peers}
                        localName={profile?.full_name || profile?.username || 'You'}
                        localAvatarUrl={profile?.avatar_url ?? undefined}
                        isLocalAudioMuted={isAudioMuted}
                        isLocalVideoOff={isVideoMuted}
                    />

                    {/* Status indicator for connecting/calling states */}
                    {(callStatus === 'calling' || callStatus === 'connecting') && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                            >
                                <span className="text-sm text-white/80 flex items-center gap-2">
                                    <motion.span
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="w-2 h-2 rounded-full bg-green-400"
                                    />
                                    {callStatus === 'calling' ? 'Calling...' : 'Connecting...'}
                                </span>
                            </motion.div>
                        </div>
                    )}

                    {/* Video Controls */}
                    <VideoControls
                        isAudioMuted={isAudioMuted}
                        isVideoMuted={isVideoMuted}
                        isScreenSharing={isScreenSharing}
                        onToggleAudio={toggleAudio}
                        onToggleVideo={toggleVideo}
                        onToggleScreenShare={handleToggleScreenShare}
                        onEndCall={handleEndCall}
                        onSwitchCamera={switchCamera}
                        isMobile={typeof window !== 'undefined' ? window.innerWidth < 768 : false}
                    />
                </motion.div>
            </AnimatePresence>
        )
    }

    return null
})

export default VideoCallModal
