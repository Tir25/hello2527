/**
 * Username Constants
 * 
 * Configuration for username validation, reserved names, and cooldown periods.
 * 
 * @module lib/constants/username.constants
 */

// ===== Reserved Usernames =====
// These usernames cannot be claimed by users

export const RESERVED_USERNAMES = [
    // Platform names
    'admin', 'support', 'help', 'heloo', 'official',
    // Roles
    'mod', 'moderator', 'staff', 'team', 'bot',
    // Technical
    'api', 'dev', 'developer', 'test', 'demo',
    'null', 'undefined',
    // Routes (prevent confusion)
    'login', 'register', 'settings', 'profile',
    'search', 'activity', 'dashboard', 'chat',
] as const

export type ReservedUsername = typeof RESERVED_USERNAMES[number]

// ===== Cooldown Configuration =====

/** Number of days between username changes */
export const USERNAME_CHANGE_COOLDOWN_DAYS = 14

// ===== Validation Patterns =====

/** UUID v4 pattern for detecting UUID vs username in URLs */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Username format pattern */
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]*[a-z0-9]$/

// ===== Length Constraints =====

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

// ===== Helper Functions =====

/**
 * Check if a string is a valid UUID
 */
export function isUUID(str: string): boolean {
    return UUID_PATTERN.test(str)
}

/**
 * Check if a username is reserved
 */
export function isReservedUsername(username: string): boolean {
    return RESERVED_USERNAMES.includes(username.toLowerCase() as ReservedUsername)
}
