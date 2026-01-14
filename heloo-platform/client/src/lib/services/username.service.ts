/**
 * Username Service
 * 
 * Responsibility: Username availability checking and updates
 * Layer: Service (Data)
 * 
 * This service handles all username-related operations including:
 * - Availability checking via RPC
 * - Username updates via RPC
 * - Client-side format validation
 * 
 * @module lib/services/username.service
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// ===== Constants =====

const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 20
const USERNAME_PATTERN = /^[a-z][a-z0-9_]*[a-z0-9]$/

// ===== Types =====

export interface UsernameValidationResult {
    valid: boolean
    error?: string
}

export interface UsernameAvailabilityResult {
    available: boolean
    error?: string
}

export interface UsernameUpdateResult {
    success: boolean
    error?: string
}

// ===== Service =====

export const usernameService = {
    /**
     * Validate username format on client-side (before server call)
     * 
     * Rules:
     * - 3-20 characters
     * - Must start with a letter
     * - Must end with a letter or number
     * - Only lowercase letters, numbers, and underscores
     * - No consecutive underscores
     */
    validateFormat(username: string): UsernameValidationResult {
        const normalized = username.toLowerCase().trim()

        if (normalized.length < USERNAME_MIN_LENGTH) {
            return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` }
        }

        if (normalized.length > USERNAME_MAX_LENGTH) {
            return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` }
        }

        if (!USERNAME_PATTERN.test(normalized)) {
            return {
                valid: false,
                error: 'Username must start with a letter and contain only lowercase letters, numbers, and underscores'
            }
        }

        if (normalized.includes('__')) {
            return { valid: false, error: 'Username cannot contain consecutive underscores' }
        }

        return { valid: true }
    },

    /**
     * Check if a username is available
     * Calls the check_username_available RPC function
     */
    async checkAvailability(username: string): Promise<UsernameAvailabilityResult> {
        const normalized = username.toLowerCase().trim()

        // Quick client-side validation first
        const validation = this.validateFormat(normalized)
        if (!validation.valid) {
            return { available: false, error: validation.error }
        }

        try {
            const { data, error } = await supabase.rpc('check_username_available', {
                target_username: normalized
            })

            if (error) {
                logger.error('username:checkAvailability', 'RPC error', error)
                return { available: false, error: error.message }
            }

            return { available: !!data }
        } catch (error) {
            logger.error('username:checkAvailability', 'Unexpected error', error)
            return { available: false, error: 'Failed to check availability' }
        }
    },

    /**
     * Update current user's username
     * Calls the update_username RPC function which handles validation and uniqueness
     */
    async updateUsername(newUsername: string): Promise<UsernameUpdateResult> {
        const normalized = newUsername.toLowerCase().trim()

        // Quick client-side validation first
        const validation = this.validateFormat(normalized)
        if (!validation.valid) {
            return { success: false, error: validation.error }
        }

        try {
            const { error } = await supabase.rpc('update_username', {
                new_username: normalized
            })

            if (error) {
                logger.error('username:update', 'RPC error', error)
                // Parse Supabase error message
                const msg = error.message || 'Failed to update username'
                return { success: false, error: msg }
            }

            logger.info('username:update', `Username updated to: ${normalized}`)
            return { success: true }
        } catch (error) {
            logger.error('username:update', 'Unexpected error', error)
            return { success: false, error: 'Failed to update username' }
        }
    },

    /**
     * Resolve username to user ID
     * Calls the get_user_by_username RPC function
     */
    async getUserByUsername(username: string): Promise<string | null> {
        const normalized = username.toLowerCase().trim()

        try {
            const { data, error } = await supabase.rpc('get_user_by_username', {
                target_username: normalized
            })

            if (error) {
                logger.error('username:getUserByUsername', 'RPC error', error)
                return null
            }

            return data as string | null
        } catch (error) {
            logger.error('username:getUserByUsername', 'Unexpected error', error)
            return null
        }
    },
}

