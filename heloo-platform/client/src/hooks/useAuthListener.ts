import { useEffect } from 'react'
import { supabase, clearInvalidAuthTokens } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { profileService } from '@/lib/services/profile.service'
import { logger } from '@/lib/logger'

export const useAuthListener = () => {
  const {
    setUser,
    setSession,
    setLoading,
    setError,
    clearError,
    setProfile,
    setProfileLoading,
    setProfileError,
  } = useAuthStore()

  useEffect(() => {
    // Track if initial session has been loaded to prevent duplicate profile fetches
    let initialSessionLoaded = false
    let initialUserId: string | null = null
    // Track in-flight profile fetch to prevent duplicates
    let profileFetchInFlight: string | null = null

    // Fetch user profile helper function
    const fetchUserProfile = async (userId: string, skipCache = false) => {
      // Prevent duplicate fetches for the same user
      if (profileFetchInFlight === userId) {
        logger.info('auth:listener', `Skipping duplicate profile fetch for user: ${userId}`)
        return
      }

      try {
        profileFetchInFlight = userId
        setProfileLoading(true)
        setProfileError(null)

        const result = await profileService.getProfile(userId, skipCache)

        if (result.success && result.data) {
          setProfile(result.data)
          logger.info('auth:listener', `Profile fetched successfully for user: ${userId}`)
        } else {
          const errorMessage = result.error || 'Failed to fetch profile'
          setProfileError(errorMessage)
          logger.error('auth:listener', 'Failed to fetch profile', result.error)
          // Don't set profile to null on error - keep existing profile if available
        }
      } catch (error) {
        const errorMessage = 'An unexpected error occurred while fetching profile'
        setProfileError(errorMessage)
        logger.error('auth:listener', 'Unexpected error fetching profile', error)
      } finally {
        setProfileLoading(false)
        profileFetchInFlight = null
      }
    }

    const isInvalidRefreshTokenError = (error: unknown): boolean => {
      if (error && typeof error === 'object') {
        const err = error as { message?: string; status?: number; name?: string }
        return (
          err.message?.includes('Invalid Refresh Token') ||
          err.message?.includes('Refresh Token Not Found') ||
          err.message?.includes('JWT expired') ||
          err.name === 'AuthApiError' ||
          err.status === 400
        )
      }
      return false
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            logger.warn('auth:listener', 'Invalid refresh token detected, clearing auth state', error)
            clearInvalidAuthTokens()
            setUser(null)
            setSession(null)
            setProfile(null)
            clearError()
            setLoading(false)
            return
          }
          logger.error('auth:listener', 'Failed to get initial session', error)
          setError(error.message || 'Failed to load session')
          setLoading(false)
          return
        }

        setSession(session)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        clearError()
        logger.info('auth:listener', `Initial session loaded. Has session: ${!!session}`)

        if (currentUser?.id) {
          initialUserId = currentUser.id
          initialSessionLoaded = true
          fetchUserProfile(currentUser.id)
        }
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          logger.warn('auth:listener', 'Invalid refresh token in catch block, clearing auth state', error)
          clearInvalidAuthTokens()
          setUser(null)
          setSession(null)
          setProfile(null)
          clearError()
          setLoading(false)
          return
        }
        logger.error('auth:listener', 'Failed to get initial session', error)
        setError('An unexpected error occurred while loading session')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('auth:listener', `Auth state changed: ${event}`)

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        logger.warn('auth:listener', 'Token refresh failed - session is null, clearing invalid tokens')
        clearInvalidAuthTokens()
        setUser(null)
        setSession(null)
        setProfile(null)
        clearError()
        setLoading(false)
        initialSessionLoaded = false
        initialUserId = null
        return
      }

      // Skip profile fetch for INITIAL_SESSION if we already fetched during getInitialSession
      const isInitialSessionEvent = event === 'INITIAL_SESSION'
      const shouldSkipProfileFetch = isInitialSessionEvent &&
        initialSessionLoaded &&
        session?.user?.id === initialUserId

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN': {
          clearError()
          setSession(session)
          const signedInUser = session?.user ?? null
          setUser(signedInUser)
          setLoading(false)
          if (signedInUser?.id && !shouldSkipProfileFetch) {
            fetchUserProfile(signedInUser.id)
          }
          break
        }

        case 'TOKEN_REFRESHED': {
          if (session) {
            clearError()
            setSession(session)
            const refreshedUser = session.user ?? null
            setUser(refreshedUser)
            setLoading(false)
            if (refreshedUser?.id && !shouldSkipProfileFetch) {
              fetchUserProfile(refreshedUser.id)
            }
          } else {
            logger.warn('auth:listener', 'Token refresh returned null session')
            clearInvalidAuthTokens()
            setUser(null)
            setSession(null)
            setProfile(null)
            clearError()
            setLoading(false)
          }
          break
        }

        case 'SIGNED_OUT': {
          clearError()
          setUser(null)
          setSession(null)
          setProfile(null)
          setProfileError(null)
          setLoading(false)
          initialSessionLoaded = false
          initialUserId = null
          break
        }

        case 'USER_UPDATED': {
          setSession(session)
          const updatedUser = session?.user ?? null
          setUser(updatedUser)
          clearError()
          // Refresh profile when user is updated (always fetch to get updated data)
          if (updatedUser?.id && !shouldSkipProfileFetch) {
            fetchUserProfile(updatedUser.id, true) // Skip cache to get fresh data
          }
          break
        }

        case 'PASSWORD_RECOVERY': {
          // Password recovery initiated - not an error
          setSession(session)
          const recoveryUser = session?.user ?? null
          setUser(recoveryUser)
          setLoading(false)
          if (recoveryUser?.id && !shouldSkipProfileFetch) {
            fetchUserProfile(recoveryUser.id)
          }
          break
        }

        case 'INITIAL_SESSION': {
          // Handle INITIAL_SESSION event - only update state if not already handled
          if (!initialSessionLoaded) {
            setSession(session)
            const defaultUser = session?.user ?? null
            setUser(defaultUser)
            setLoading(false)
            if (defaultUser?.id) {
              initialUserId = defaultUser.id
              initialSessionLoaded = true
              fetchUserProfile(defaultUser.id)
            }
          } else {
            // Already loaded, just update session/user state without fetching profile
            setSession(session)
            const defaultUser = session?.user ?? null
            setUser(defaultUser)
            setLoading(false)
          }
          break
        }

        default: {
          setSession(session)
          const defaultUser = session?.user ?? null
          setUser(defaultUser)
          setLoading(false)
          if (defaultUser?.id && !shouldSkipProfileFetch) {
            fetchUserProfile(defaultUser.id)
          }
          break
        }
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setLoading, setError, clearError, setProfile, setProfileLoading, setProfileError])
}

