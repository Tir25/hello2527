/**
 * useActivityActions Hook
 * 
 * Responsibility: Handle accept/decline/follow-back actions
 * Layer: Logic (Hook)
 * 
 * Features:
 * - Accept request with optimistic update
 * - Decline request with optimistic update
 * - Follow back user
 * - Dismiss follow-back suggestion
 */

import { useState, useCallback } from 'react'
import { profileService } from '@/lib/services/profile.service'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import type { IncomingRequest } from './types'

interface UseActivityActionsOptions {
    requests: IncomingRequest[]
    setRequests: React.Dispatch<React.SetStateAction<IncomingRequest[]>>
}

interface UseActivityActionsResult {
    processingIds: Set<string>
    acceptedRequests: IncomingRequest[]
    followingBackIds: Set<string>
    handleAccept: (request: IncomingRequest) => Promise<void>
    handleDecline: (request: IncomingRequest) => Promise<void>
    handleFollowBack: (request: IncomingRequest) => Promise<void>
    handleDismissFollowBack: (requesterId: string) => void
}

export const useActivityActions = ({
    requests: _requests,
    setRequests,
}: UseActivityActionsOptions): UseActivityActionsResult => {
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
    const [acceptedRequests, setAcceptedRequests] = useState<IncomingRequest[]>([])
    const [followingBackIds, setFollowingBackIds] = useState<Set<string>>(new Set())

    // Accept request
    const handleAccept = useCallback(async (request: IncomingRequest) => {
        if (processingIds.has(request.relationship_id)) return

        try {
            setProcessingIds((prev) => new Set(prev).add(request.relationship_id))
            setRequests((prev) => prev.filter((r) => r.relationship_id !== request.relationship_id))

            const result = await profileService.acceptRequest(request.relationship_id)

            if (!result.success) {
                // Rollback
                setRequests((prev) => [...prev, request].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ))
                toast.error(result.error || 'Failed to accept request')
                logger.error('useActivityActions:accept', 'Failed', result.error)
                return
            }

            // Check if already following
            const { data: existingFollow } = await supabase
                .from('relationships')
                .select('id')
                .eq('requester_id', (await supabase.auth.getUser()).data.user?.id)
                .eq('recipient_id', request.requester_id)
                .eq('status', 'accepted')
                .eq('is_chat_request', false)
                .maybeSingle()

            if (existingFollow) {
                toast.success('Request accepted!')
            } else {
                setAcceptedRequests((prev) => [request, ...prev])
                toast.success('Request accepted! You can now follow back.')
            }
            logger.info('useActivityActions:accept', `Accepted: ${request.relationship_id}`)
        } catch (error) {
            setRequests((prev) => [...prev, request].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ))
            logger.error('useActivityActions:accept', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setProcessingIds((prev) => {
                const next = new Set(prev)
                next.delete(request.relationship_id)
                return next
            })
        }
    }, [processingIds, setRequests])

    // Decline request
    const handleDecline = useCallback(async (request: IncomingRequest) => {
        if (processingIds.has(request.relationship_id)) return

        try {
            setProcessingIds((prev) => new Set(prev).add(request.relationship_id))
            setRequests((prev) => prev.filter((r) => r.relationship_id !== request.relationship_id))

            const result = await profileService.declineRequest(request.requester_id)

            if (!result.success) {
                setRequests((prev) => [...prev, request].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ))
                toast.error(result.error || 'Failed to decline request')
                logger.error('useActivityActions:decline', 'Failed', result.error)
                return
            }

            toast.success('Request declined')
            logger.info('useActivityActions:decline', `Declined: ${request.relationship_id}`)
        } catch (error) {
            setRequests((prev) => [...prev, request].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ))
            logger.error('useActivityActions:decline', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setProcessingIds((prev) => {
                const next = new Set(prev)
                next.delete(request.relationship_id)
                return next
            })
        }
    }, [processingIds, setRequests])

    // Follow back
    const handleFollowBack = useCallback(async (request: IncomingRequest) => {
        if (followingBackIds.has(request.requester_id)) return

        try {
            setFollowingBackIds((prev) => new Set(prev).add(request.requester_id))

            const result = await profileService.followUser(request.requester_id)

            if (!result.success) {
                toast.error(result.error || 'Failed to follow back')
                logger.error('useActivityActions:followBack', 'Failed', result.error)
                return
            }

            setAcceptedRequests((prev) => prev.filter((r) => r.requester_id !== request.requester_id))
            const displayName = request.profile.full_name || request.profile.username || 'User'
            toast.success(`You are now following ${displayName}!`)
            logger.info('useActivityActions:followBack', `Followed: ${request.requester_id}`)
        } catch (error) {
            logger.error('useActivityActions:followBack', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setFollowingBackIds((prev) => {
                const next = new Set(prev)
                next.delete(request.requester_id)
                return next
            })
        }
    }, [followingBackIds])

    // Dismiss follow-back
    const handleDismissFollowBack = useCallback((requesterId: string) => {
        setAcceptedRequests((prev) => prev.filter((r) => r.requester_id !== requesterId))
    }, [])

    return {
        processingIds,
        acceptedRequests,
        followingBackIds,
        handleAccept,
        handleDecline,
        handleFollowBack,
        handleDismissFollowBack,
    }
}
