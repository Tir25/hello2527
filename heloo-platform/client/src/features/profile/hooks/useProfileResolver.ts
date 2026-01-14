/**
 * useProfileResolver Hook
 * 
 * Resolves URL parameter (username or UUID) to user ID.
 * Enables username-based profile URLs like Instagram/Twitter.
 * 
 * @module features/profile/hooks/useProfileResolver
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usernameService } from '@/lib/services/username.service'
import { isUUID } from '@/lib/constants/username.constants'
import { logger } from '@/lib/logger'

interface UseProfileResolverReturn {
    /** Resolved user ID (UUID) */
    userId: string | undefined
    /** Whether resolution is in progress */
    loading: boolean
    /** Error message if resolution failed */
    error: string | null
    /** Whether viewing own profile */
    isOwnProfile: boolean
    /** The original URL param (for display) */
    urlParam: string | undefined
}

/**
 * Resolves profile URL param to user ID
 * - If param is UUID: use directly
 * - If param is username: resolve via RPC
 * - If no param: use current user's ID
 */
export function useProfileResolver(): UseProfileResolverReturn {
    const { userId: urlParam } = useParams<{ userId?: string }>()
    const { user } = useAuthStore()

    // Determine if we need to resolve (username) or can use directly (UUID/no param)
    const needsResolution = urlParam ? !isUUID(urlParam) : false

    const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(undefined)
    const [loading, setLoading] = useState(needsResolution) // Start loading if we need to resolve
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Reset state when URL param changes
        setError(null)

        const resolveUser = async () => {
            // No param = own profile
            if (!urlParam) {
                setResolvedUserId(user?.id)
                setLoading(false)
                return
            }

            // UUID format = use directly
            if (isUUID(urlParam)) {
                setResolvedUserId(urlParam)
                setLoading(false)
                return
            }

            // Username format = resolve via RPC
            setLoading(true)

            try {
                const userId = await usernameService.getUserByUsername(urlParam)

                if (userId) {
                    setResolvedUserId(userId)
                } else {
                    setError('User not found')
                    setResolvedUserId(undefined)
                }
            } catch (err) {
                logger.error('useProfileResolver', 'Failed to resolve username', err)
                setError('Failed to load profile')
                setResolvedUserId(undefined)
            } finally {
                setLoading(false)
            }
        }

        resolveUser()
    }, [urlParam, user?.id])

    const isOwnProfile = !urlParam || resolvedUserId === user?.id

    return {
        userId: resolvedUserId,
        loading,
        error,
        isOwnProfile,
        urlParam,
    }
}
