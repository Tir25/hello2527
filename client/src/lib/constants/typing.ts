/**
 * Typing Indicator Constants
 * Configuration for typing indicator behavior
 */

// Timeout before emitting typing_stop after user stops typing (in milliseconds)
export const TYPING_STOP_TIMEOUT = 2000 // 2 seconds

// Throttle window for typing_start events (in milliseconds)
// Prevents spam by only allowing one typing_start per window
export const TYPING_THROTTLE_MS = 500 // 500ms

// Server-side timeout for auto-clearing typing indicators (in milliseconds)
// This is a safety net in case client disconnects without sending typing_stop
export const TYPING_SERVER_TIMEOUT = 5000 // 5 seconds

