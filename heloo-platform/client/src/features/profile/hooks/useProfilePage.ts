import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { profileService } from '../services/profile.service'
import { useProfileResolver } from './useProfileResolver'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'
import { supabase } from '@/lib/supabase'
import type { Profile } from '../types/profile.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Resolve username/UUID from URL to user ID
  const { userId: resolvedUserId, error: resolveError, isOwnProfile } = useProfileResolver()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refs to prevent duplicate fetches
  const profileUserIdRef = useRef<string | undefined>(resolvedUserId)
  const isLoadingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const relationshipChannelRef = useRef<RealtimeChannel | null>(null)

  // Update ref when resolved userId changes
  useEffect(() => {
    profileUserIdRef.current = resolvedUserId
  }, [resolvedUserId])

  // Handle resolution errors
  useEffect(() => {
    if (resolveError) {
      setError(resolveError)
      setLoading(false)
    }
  }, [resolveError])

  // Derived values
  const profileUserId = resolvedUserId

  // Load profile
  const loadProfile = useCallback(async (forceRefresh = false) => {
    const currentUserId = profileUserIdRef.current
    if (!currentUserId) {
      setLoading(false)
      return
    }

    // Prevent duplicate fetches
    if (isLoadingRef.current) {
      logger.info('ProfilePage:loadProfile', 'Skipping - already loading')
      return
    }

    // Skip if same user already loaded (unless force refresh)
    // Note: We use lastFetchedUserIdRef to avoid stale closure issue with profile state
    if (!forceRefresh && lastFetchedUserIdRef.current === currentUserId) {
      logger.info('ProfilePage:loadProfile', 'Skipping - same user loaded')
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      const result = await profileService.getProfile(currentUserId, true, true)

      if (!result.success) {
        const errorMessage = result.error || 'Failed to load profile'
        setError(errorMessage)
        toast.error(errorMessage)
        logger.error('ProfilePage:loadProfile', 'Failed', result.error)
        return
      }

      if (result.data) {
        setProfile(result.data)
        lastFetchedUserIdRef.current = currentUserId
      } else {
        setError('Profile not found')
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      logger.error('ProfilePage:loadProfile', 'Unexpected error', err)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, []) // Empty deps - uses refs for mutable values

  // Single consolidated useEffect for initial load
  useEffect(() => {
    if (profileUserId) {
      if (lastFetchedUserIdRef.current !== profileUserId) {
        lastFetchedUserIdRef.current = null
      }
      loadProfile()
    }
  }, [profileUserId, loadProfile])

  // Real-time subscription for relationship changes
  // This ensures profile updates when someone follows/unfollows/accepts
  // NOTE: Supabase postgres_changes doesn't support or() filters, so we use multiple handlers
  useEffect(() => {
    if (!user?.id || !profileUserId) return

    // Clean up existing subscription
    if (relationshipChannelRef.current) {
      supabase.removeChannel(relationshipChannelRef.current)
    }

    const handleRelationshipChange = (payload: any) => {
      const record = payload.new || payload.old
      if (!record) return

      // Only process if it involves both the current user and the profile user
      const involvesMe = record.requester_id === user.id || record.recipient_id === user.id
      const involvesProfile = record.requester_id === profileUserId || record.recipient_id === profileUserId

      if (involvesMe && involvesProfile) {
        logger.info('useProfilePage:relationship_change', 'Relationship changed, refreshing profile', payload)
        setTimeout(() => loadProfile(true), 200)
      }
    }

    // Subscribe to ALL relationship changes and filter in the callback
    // This is necessary because Supabase doesn't support complex filters in postgres_changes
    const channel = supabase
      .channel(`profile-relationships-${profileUserId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'relationships',
        },
        handleRelationshipChange
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'relationships',
        },
        handleRelationshipChange
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'relationships',
        },
        handleRelationshipChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useProfilePage', 'Subscribed to relationship changes')
        }
      })

    relationshipChannelRef.current = channel

    return () => {
      if (relationshipChannelRef.current) {
        supabase.removeChannel(relationshipChannelRef.current)
        relationshipChannelRef.current = null
      }
    }
  }, [user?.id, profileUserId, loadProfile])

  // Handle profile update (after relationship changes)
  const handleProfileUpdate = useCallback(() => {
    setTimeout(() => loadProfile(true), 100)
  }, [loadProfile])

  // Handle retry
  const handleRetry = useCallback(() => {
    loadProfile(true)
  }, [loadProfile])

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // Check if profile is private
  // NEW RULE: Profile is private unless the VIEWER follows the profile owner
  // This means: You can only see someone's profile if you follow them (accepted)
  const isPrivate = profile && !isOwnProfile
    ? !profile.amIFollowing // If I don't follow them, it's private to me
    : false

  return {
    // State
    profile,
    loading,
    error,

    // Derived
    isOwnProfile,
    isPrivate,

    // Actions
    handleProfileUpdate,
    handleRetry,
    handleBack,
  }
}
