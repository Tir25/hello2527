/**
 * useActivityRequests Hook (Refactored)
 * 
 * Main composition hook that combines modular activity hooks.
 * 
 * Responsibility: Compose fetch, actions, realtime, and helpers
 * Layer: Composition (Hook)
 * 
 * This file is now a thin orchestration layer (~50 lines)
 */

import { useEffect } from 'react'
import { useActivityFetch } from './useActivityFetch'
import { useActivityActions } from './useActivityActions'
import { useActivityRealtime } from './useActivityRealtime'
import { getDisplayName, getProfileFromRequest } from './helpers'
import type { UseActivityRequestsResult } from './types'

interface UseActivityRequestsOptions {
    enabled?: boolean
}

export const useActivityRequests = (
    options: UseActivityRequestsOptions = {}
): UseActivityRequestsResult => {
    const { enabled = true } = options

    // Fetch hook
    const { requests, loading, setRequests, fetchRequests } = useActivityFetch()

    // Actions hook
    const {
        processingIds,
        acceptedRequests,
        followingBackIds,
        handleAccept,
        handleDecline,
        handleFollowBack,
        handleDismissFollowBack,
    } = useActivityActions({ requests, setRequests })

    // Realtime hook
    useActivityRealtime({ enabled, setRequests })

    // Initial fetch
    useEffect(() => {
        if (enabled) {
            fetchRequests()
        }
    }, [enabled, fetchRequests])

    return {
        // State
        requests,
        loading,
        processingIds,
        acceptedRequests,
        followingBackIds,

        // Actions
        handleAccept,
        handleDecline,
        handleFollowBack,
        handleDismissFollowBack,
        refetch: fetchRequests,

        // Helpers
        getDisplayName,
        getProfileFromRequest,
    }
}

// Re-export types for convenience
export type { IncomingRequest } from './types'
