import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { relationshipService } from '../services/relationship'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import { useChatStore } from '@/store/chat'
import type { Profile } from '../types/profile.types'

interface UseProfileActionsProps {
    profile: Profile
    userId?: string
    onProfileUpdate?: () => void
}

export const useProfileActions = ({ profile, userId, onProfileUpdate }: UseProfileActionsProps) => {
    const navigate = useNavigate()
    const { setSelectedUser } = useChatStore()

    // Loading states
    const [loading, setLoading] = useState(false)
    const [acceptLoading, setAcceptLoading] = useState(false)
    const [declineLoading, setDeclineLoading] = useState(false)

    const handleMessage = useCallback(() => {
        if (!profile) return

        // Set selected user BEFORE navigating - this opens the chat immediately
        // Works even for "ghost chats" (deleted/new conversations)
        setSelectedUser(profile)
        navigate('/')
        logger.info('useProfileActions:handleMessage', `Opening chat for user: ${profile.id}`)
    }, [navigate, profile, setSelectedUser])

    const handleFollow = useCallback(async () => {
        if (!userId || !profile.id) return
        try {
            setLoading(true)
            // followUser creates 'pending' status - requires acceptance by other user
            const result = await relationshipService.followUser(profile.id)
            if (!result.success) {
                toast.error(result.error || 'Failed to follow user')
                logger.error('useProfileActions:handleFollow', 'Failed', result.error)
                return
            }
            toast.success('Follow request sent!')
            onProfileUpdate?.()
        } catch (error) {
            logger.error('useProfileActions:handleFollow', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }, [profile.id, userId, onProfileUpdate])

    const handleAcceptRequest = useCallback(async () => {
        if (!profile.relationship_id) return
        try {
            setAcceptLoading(true)
            const result = await relationshipService.acceptRequest(profile.relationship_id)
            if (!result.success) {
                toast.error(result.error || 'Failed to accept request')
                logger.error('useProfileActions:handleAcceptRequest', 'Failed', result.error)
                return
            }
            toast.success('Connection accepted!')
            onProfileUpdate?.()
        } catch (error) {
            logger.error('useProfileActions:handleAcceptRequest', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setAcceptLoading(false)
        }
    }, [profile.relationship_id, onProfileUpdate])

    const handleDeclineRequest = useCallback(async () => {
        if (!profile.relationship_id || !userId || !profile.id) return
        try {
            setDeclineLoading(true)
            // Use declineRequest (not unfollow) - this properly handles incoming pending requests
            const result = await relationshipService.declineRequest(profile.id)
            if (!result.success) {
                toast.error(result.error || 'Failed to decline request')
                logger.error('useProfileActions:handleDeclineRequest', 'Failed', result.error)
                return
            }
            toast.success('Request declined')
            onProfileUpdate?.()
        } catch (error) {
            logger.error('useProfileActions:handleDeclineRequest', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setDeclineLoading(false)
        }
    }, [profile.id, profile.relationship_id, userId, onProfileUpdate])

    const handleUnfollow = useCallback(async () => {
        if (!userId || !profile.id) return
        try {
            setLoading(true)
            const result = await relationshipService.unfollow(profile.id)
            if (!result.success) {
                toast.error(result.error || 'Failed to unfollow')
                logger.error('useProfileActions:handleUnfollow', 'Failed', result.error)
                return false
            }
            toast.success('Unfollowed successfully')
            // Update profile immediately to reflect new relationship status
            // This ensures UI transitions from "Message" -> "Follow + Message" buttons
            onProfileUpdate?.()
            logger.info('useProfileActions:handleUnfollow', `Successfully unfollowed: ${profile.id}`)
            return true
        } catch (error) {
            logger.error('useProfileActions:handleUnfollow', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
            return false
        } finally {
            setLoading(false)
        }
    }, [profile.id, userId, onProfileUpdate])

    const handleBlock = useCallback(async () => {
        if (!userId || !profile.id) return
        try {
            setLoading(true)
            const result = await relationshipService.blockUser(profile.id)
            if (!result.success) {
                toast.error(result.error || 'Failed to block user')
                logger.error('useProfileActions:handleBlock', 'Failed', result.error)
                return false
            }
            toast.success('User blocked')
            onProfileUpdate?.()
            return true
        } catch (error) {
            logger.error('useProfileActions:handleBlock', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
            return false
        } finally {
            setLoading(false)
        }
    }, [profile.id, userId, onProfileUpdate])

    const handleUnblock = useCallback(async () => {
        if (!userId || !profile.id) return
        try {
            setLoading(true)
            const result = await relationshipService.unblockUser(profile.id)
            if (!result.success) {
                toast.error(result.error || 'Failed to unblock user')
                logger.error('useProfileActions:handleUnblock', 'Failed', result.error)
                return
            }
            toast.success('User unblocked')
            onProfileUpdate?.()
        } catch (error) {
            logger.error('useProfileActions:handleUnblock', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }, [profile.id, userId, onProfileUpdate])

    const handleCancelRequest = useCallback(async () => {
        if (!userId || !profile.id) return
        try {
            setLoading(true)
            // Use cancelRequest (not unfollow) - specifically for cancelling MY pending outgoing request
            const result = await relationshipService.cancelRequest(profile.id)
            if (!result.success) {
                toast.error(result.error || 'Failed to cancel request')
                logger.error('useProfileActions:cancelRequest', 'Failed', result.error)
                return
            }
            toast.success('Request cancelled')
            onProfileUpdate?.()
        } catch (error) {
            logger.error('useProfileActions:cancelRequest', 'Unexpected error', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }, [profile.id, userId, onProfileUpdate])

    const handleEditProfile = useCallback(() => {
        navigate('/profile')
    }, [navigate])

    return {
        // Loading states
        loading,
        acceptLoading,
        declineLoading,
        setLoading,

        // Action handlers
        handleMessage,
        handleFollow,
        handleAcceptRequest,
        handleDeclineRequest,
        handleUnfollow,
        handleBlock,
        handleUnblock,
        handleCancelRequest,
        handleEditProfile,
    }
}
