/**
 * String Utility Functions
 * 
 * Centralized string manipulation utilities used across the app.
 * 
 * @module lib/utils/string.utils
 */

/**
 * Clean username by removing UUID suffix if present.
 * 
 * Many usernames have UUID suffixes added for uniqueness (e.g., "user_53bad179").
 * This function removes those suffixes for display purposes.
 * 
 * @example
 * cleanUsername("dipaliraval78_53bad179") // "dipaliraval78"
 * cleanUsername("john_doe") // "john_doe" (not a UUID suffix)
 * cleanUsername(null) // null
 */
export function cleanUsername(username: string | null): string | null {
    if (!username) return null

    // Pattern: name_UUID (8 hex chars at end after underscore)
    const uuidSuffixPattern = /_[a-f0-9]{8}$/i
    return username.replace(uuidSuffixPattern, '')
}

/**
 * Get display username from a profile object.
 * Falls back to email prefix if no username is set.
 * 
 * @param profile - Profile object with username and email
 * @returns Cleaned username for display
 */
export function getDisplayUsername(profile: {
    username?: string | null
    email?: string | null
}): string | null {
    if (profile.username) {
        return cleanUsername(profile.username)
    }

    // Extract username from email (everything before @)
    if (profile.email) {
        const emailUsername = profile.email.split('@')[0]
        // Clean any numeric suffixes that were added for uniqueness
        return emailUsername.replace(/\d+$/, '') || emailUsername
    }

    return null
}

/**
 * Format large numbers for display (1000 -> 1K, 1000000 -> 1M)
 * 
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
}
// Note: truncateText is available from @/lib/utils

