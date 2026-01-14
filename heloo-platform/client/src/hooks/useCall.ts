/**
 * useCall Hook
 * 
 * Convenience hook for accessing the CallContext.
 * Provides type-safe access to call state and actions.
 * 
 * @module hooks/useCall
 * 
 * @example
 * ```tsx
 * import { useCall } from '@/hooks/useCall'
 * 
 * function VideoCallButton({ groupId, userId }: { groupId: string, userId: string }) {
 *     const { startGroupCall, callStatus, endCall } = useCall()
 * 
 *     const handleClick = async () => {
 *         if (callStatus === 'idle') {
 *             await startGroupCall(groupId, userId, { username: 'John' })
 *         } else {
 *             await endCall()
 *         }
 *     }
 * 
 *     return (
 *         <button onClick={handleClick}>
 *             {callStatus === 'idle' ? 'Start Call' : 'End Call'}
 *         </button>
 *     )
 * }
 * ```
 */

import { useCallContext } from '@/context/call'
import type {
    CallStatus,
    CallType,
    PeerConnection,
    CallState,
    CallActions,
} from '@/context/call'

// Re-export types for convenience
export type { CallStatus, CallType, PeerConnection, CallState, CallActions }

/**
 * Hook to access call functionality
 * 
 * Must be used within a CallProvider component.
 * 
 * @throws Error if used outside of CallProvider
 * @returns Call state and actions
 */
export function useCall() {
    return useCallContext()
}

/**
 * Hook to get only call status (optimized selector)
 * 
 * @returns Current call status
 */
export function useCallStatus(): CallStatus {
    const { callStatus } = useCallContext()
    return callStatus
}

/**
 * Hook to get only peers (optimized selector)
 * 
 * @returns Array of connected peers
 */
export function useCallPeers(): PeerConnection[] {
    const { peers } = useCallContext()
    return peers
}

/**
 * Hook to check if in an active call
 * 
 * @returns True if call is in progress
 */
export function useIsInCall(): boolean {
    const { callStatus } = useCallContext()
    return callStatus !== 'idle'
}

/**
 * Hook to get local stream
 * 
 * @returns Local MediaStream or null
 */
export function useLocalStream(): MediaStream | null {
    const { myStream } = useCallContext()
    return myStream
}

/**
 * Hook to get mute states
 * 
 * @returns Object with audio and video mute states
 */
export function useMuteStates() {
    const { isAudioMuted, isVideoMuted, isScreenSharing } = useCallContext()
    return { isAudioMuted, isVideoMuted, isScreenSharing }
}

/**
 * Hook to get call actions only
 * 
 * @returns Object with all call actions
 */
export function useCallActions(): CallActions {
    const {
        startGroupCall,
        startDMCall,
        joinCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        switchCamera,
        answerCall,
        declineCall,
    } = useCallContext()

    return {
        startGroupCall,
        startDMCall,
        joinCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        switchCamera,
        answerCall,
        declineCall,
    }
}

export default useCall
