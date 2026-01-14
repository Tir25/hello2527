/**
 * Local Stream Types
 * 
 * Type definitions for useLocalStream hook.
 * @module hooks/call/localStreamTypes
 */

export interface UseLocalStreamOptions {
    /** Enable audio by default */
    audio?: boolean
    /** Enable video by default */
    video?: boolean
}

export interface UseLocalStreamReturn {
    /** The local media stream */
    stream: MediaStream | null
    /** Error message if stream acquisition failed */
    error: string | null
    /** Whether audio is muted */
    isAudioMuted: boolean
    /** Whether video is muted */
    isVideoMuted: boolean
    /** Whether screen sharing is active */
    isScreenSharing: boolean
    /** Initialize/acquire the local stream */
    initializeStream: (options?: { video?: boolean; audio?: boolean }) => Promise<MediaStream>
    /** Toggle audio mute state */
    toggleAudio: () => void
    /** Toggle video mute state */
    toggleVideo: () => void
    /** Toggle screen sharing */
    toggleScreenShare: () => Promise<void>
    /** Switch camera (front/back) */
    switchCamera: () => Promise<void>
    /** Stop all tracks and cleanup */
    stopStream: () => void
    /** Get the current stream reference */
    getStream: () => MediaStream | null
}

export interface LocalStreamRefs {
    stream: React.MutableRefObject<MediaStream | null>
    originalVideoTrack: React.MutableRefObject<MediaStreamTrack | null>
    isMounted: React.MutableRefObject<boolean>
}
