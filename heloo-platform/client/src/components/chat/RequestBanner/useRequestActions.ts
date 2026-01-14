/**
 * useRequestActions Hook
 * 
 * Handles all action handlers for the request banner.
 * @module components/chat/RequestBanner/useRequestActions
 */

import { useState, useCallback } from 'react'
import { profileService, relationshipService } from '@/lib/services/profile.service'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import type { BannerActionState } from './types'

interface UseRequestActionsOptions {
    userId: string
    relationshipId?: string
    onStatusChange: () => void
}

export function useRequestActions({
    userId,
    relationshipId,
    onStatusChange,
}: UseRequestActionsOptions) {
    const [loading, setLoading] = useState(false)
    const [declineLoading, setDeclineLoading] = useState(false)
    const [blockLoading, setBlockLoading] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)

    const actionState: BannerActionState = {
        loading,
        declineLoading,
        blockLoading,
        followLoading,
    }

    const isAnyLoading = loading || declineLoading || blockLoading || followLoading

    const handleFollow = useCallback(async () => {
        try {
            setFollowLoading(true)
            const result = await relationshipService.followUser(userId)
            if (!result.success) {
                toast.error(result.error || 'Failed to follow user')
                logger.error('RequestBanner:handleFollow', 'Failed to follow', result.error)
                return
            }
            toast.success('Following!')
            onStatusChange()
        } catch (error) {
            logger.error('RequestBanner:handleFollow', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setFollowLoading(false)
        }
    }, [userId, onStatusChange])

    const handleAccept = useCallback(async () => {
        if (!relationshipId) return
        try {
            setLoading(true)
            const result = await profileService.acceptChatRequest(userId)
            if (!result.success) {
                toast.error(result.error || 'Failed to accept request')
                logger.error('RequestBanner:handleAccept', 'Failed to accept chat', result.error)
                return
            }
            toast.success('Chat request accepted!')
            onStatusChange()
        } catch (error) {
            logger.error('RequestBanner:handleAccept', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }, [userId, relationshipId, onStatusChange])

    const handleDecline = useCallback(async () => {
        try {
            setDeclineLoading(true)
            const result = await profileService.declineRequest(userId)
            if (!result.success) {
                toast.error(result.error || 'Failed to decline request')
                logger.error('RequestBanner:handleDecline', 'Failed to decline', result.error)
                return
            }
            toast.success('Request declined')
            onStatusChange()
        } catch (error) {
            logger.error('RequestBanner:handleDecline', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setDeclineLoading(false)
        }
    }, [userId, onStatusChange])

    const handleDeclineAndBlock = useCallback(async () => {
        try {
            setBlockLoading(true)
            const blockResult = await profileService.blockUser(userId)
            if (!blockResult.success) {
                toast.error(blockResult.error || 'Failed to block user')
                logger.error('RequestBanner:handleDeclineAndBlock', 'Failed to block', blockResult.error)
                return
            }
            toast.success('Request declined and user blocked')
            onStatusChange()
        } catch (error) {
            logger.error('RequestBanner:handleDeclineAndBlock', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setBlockLoading(false)
        }
    }, [userId, onStatusChange])

    const handleUnblock = useCallback(async () => {
        try {
            setLoading(true)
            const result = await profileService.unblockUser(userId)
            if (!result.success) {
                toast.error(result.error || 'Failed to unblock user')
                logger.error('RequestBanner:handleUnblock', 'Failed to unblock', result.error)
                return
            }
            toast.success('User unblocked')
            onStatusChange()
        } catch (error) {
            logger.error('RequestBanner:handleUnblock', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }, [userId, onStatusChange])

    return {
        actionState,
        isAnyLoading,
        handleFollow,
        handleAccept,
        handleDecline,
        handleDeclineAndBlock,
        handleUnblock,
    }
}
