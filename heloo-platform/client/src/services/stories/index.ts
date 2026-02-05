/**
 * Stories Service Index
 * Re-exports all story-related services (image/video only)
 * 
 * @module services/stories
 */

// CRUD operations
export {
    fetchStories,
    fetchUserStories,
    createStory,
    deleteStory,
    markStoryViewed,
    fetchStoryViewers,
    addReaction,
    fetchReactions,
} from './storyService'

// Image processing
export {
    compressImage,
    getImageDimensions,
} from './imageCompressor'

// Upload
export {
    uploadStoryMedia,
    deleteStoryFiles,
} from './storyUpload'

// Video processing
export {
    getVideoDuration,
    DEFAULT_DURATIONS,
} from './videoUtils'

// Video compression
export {
    compressVideo,
    needsCompression,
} from './videoCompressor'

// Story mentions
export {
    extractMentions,
    resolveUsername,
    canViewStory,
    isConversationMuted,
} from './storyMentionUtils'

export { processStoryMentions } from './storyMentionProcessor'

// Countdown reminders
export {
    subscribeToReminder,
    unsubscribeFromReminder,
    isSubscribed,
    getReminderCount,
} from './countdownService'

// Question responses
export {
    submitResponse,
    getResponses,
    getResponseCount,
    hasUserResponded,
} from './questionService'
