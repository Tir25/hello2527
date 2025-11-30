import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
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
    // Fetch user profile helper function
    const fetchUserProfile = async (userId: string) => {
      try {
        setProfileLoading(true)
        setProfileError(null)
        
        const result = await profileService.getProfile(userId)
        
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
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error('auth:listener', 'Failed to get initial session', error)
          setError(error.message || 'Failed to load session')
          setLoading(false)
          return
        }

        setSession(session)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        clearError() // Clear any previous errors on successful session load
        logger.info('auth:listener', `Initial session loaded. Has session: ${!!session}`)
        
        // Fetch profile if user exists
        if (currentUser?.id) {
          fetchUserProfile(currentUser.id)
        }
      } catch (error) {
        logger.error('auth:listener', 'Failed to get initial session', error)
        setError('An unexpected error occurred while loading session')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('auth:listener', `Auth state changed: ${event}`)

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED': {
          // Clear errors on successful auth events
          clearError()
          setSession(session)
          const signedInUser = session?.user ?? null
          setUser(signedInUser)
          setLoading(false)
          // Fetch profile when user signs in
          if (signedInUser?.id) {
            fetchUserProfile(signedInUser.id)
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
          break
        }

        case 'USER_UPDATED': {
          setSession(session)
          const updatedUser = session?.user ?? null
          setUser(updatedUser)
          clearError()
          // Refresh profile when user is updated
          if (updatedUser?.id) {
            fetchUserProfile(updatedUser.id)
          }
          break
        }

        case 'PASSWORD_RECOVERY': {
          // Password recovery initiated - not an error
          setSession(session)
          const recoveryUser = session?.user ?? null
          setUser(recoveryUser)
          setLoading(false)
          if (recoveryUser?.id) {
            fetchUserProfile(recoveryUser.id)
          }
          break
        }

        default: {
          setSession(session)
          const defaultUser = session?.user ?? null
          setUser(defaultUser)
          setLoading(false)
          if (defaultUser?.id) {
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

