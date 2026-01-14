/**
 * Story Types
 * Core type definitions for the Stories feature
 */

/** Media type for stories */
export type StoryMediaType = 'image' | 'video'

/** Text overlay for story editor */
export interface TextOverlay {
    id: string
    text: string
    x: number
    y: number
    color: string
    scale: number
    rotation: number
    font: string
}

/** Sticker for story editor */
export interface Sticker {
    id: string
    type: 'poll' | 'location' | 'mention' | 'question' | 'hashtag' | 'countdown'
    x: number
    y: number
    scale: number
    rotation: number
    data: string
}

/** Base story structure from database */
export interface Story {
    id: string
    user_id: string
    media_url: string
    media_type: StoryMediaType
    thumbnail_url: string | null
    duration_seconds: number
    music_url: string | null
    music_title: string | null
    caption: string | null
    // New feature fields (optional for backwards compatibility)
    filter?: string
    text_overlays?: TextOverlay[]
    stickers?: Sticker[]
    scheduled_at?: string | null
    audience_type?: 'public' | 'close_friends'
    posted_at: string
    expires_at: string
    view_count: number
}

/** Story with user profile info */
export interface StoryWithUser extends Story {
    user: {
        id: string
        username: string
        avatar_url: string | null
    }
}

/** Group of stories by user */
export interface StoryGroup {
    userId: string
    user: {
        id: string
        username: string
        avatar_url: string | null
    }
    stories: Story[]
    hasUnviewed: boolean
    latestPostedAt: string
}

/** Story view record */
export interface StoryView {
    story_id: string
    viewer_id: string
    viewed_at: string
}

/** Story reaction record */
export interface StoryReaction {
    story_id: string
    user_id: string
    emoji: string
    created_at: string
}

/** Viewer with reaction info */
export interface StoryViewerInfo {
    user_id: string
    username: string
    avatar_url: string | null
    viewed_at: string
    has_reacted?: boolean
    reaction_emoji?: string | null
}

/** Input for creating a new story */
export interface CreateStoryInput {
    mediaFile: File
    mediaType: StoryMediaType
    caption?: string
    musicBlob?: Blob
    musicTitle?: string
    // New feature inputs
    filter?: string
    textOverlays?: TextOverlay[]
    stickers?: Sticker[]
    scheduledAt?: string | null
}

/** Upload progress state */
export interface UploadProgress {
    stage: 'compressing' | 'uploading' | 'processing' | 'complete' | 'error'
    progress: number
    message: string
}

/** Story viewer state */
export interface ViewerState {
    isOpen: boolean
    currentGroupIndex: number
    currentStoryIndex: number
    isPaused: boolean
    isMuted: boolean
}
