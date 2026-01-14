/**
 * useActivityFetch Hook
 * 
 * Responsibility: Fetch incoming requests from the API
 * Layer: Data (Hook)
 * 
 * Features:
 * - Fetch incoming requests
 * - Handle loading state
 * - Error handling with toast notifications
 */

import { useState, useCallback } from 'react'
import { profileService } from '@/lib/services/profile.service'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import type { IncomingRequest } from './types'

interface UseActivityFetchResult {
    requests: IncomingRequest[]
    loading: boolean
    setRequests: React.Dispatch<React.SetStateAction<IncomingRequest[]>>
    fetchRequests: () => Promise<void>
}

export const useActivityFetch = (): UseActivityFetchResult => {
    const [requests, setRequests] = useState<IncomingRequest[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true)
            const result = await profileService.getIncomingRequests()

            if (!result.success) {
                logger.error('useActivityFetch', 'Failed to fetch requests', result.error)
                toast.error(result.error || 'Failed to load requests')
                return
            }

            setRequests(result.data || [])
            logger.info('useActivityFetch', `Loaded ${result.data?.length || 0} requests`)
        } catch (error) {
            logger.error('useActivityFetch', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        requests,
        loading,
        setRequests,
        fetchRequests,
    }
}
