import { authService } from '@/lib/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import type { LoginCredentials, SignupCredentials } from '@/lib/services/auth.service'

export const useAuth = () => {
  const { setUser, setSession, setLoading, setError, clearAuth, clearError } = useAuthStore()

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      clearError()

      const result = await authService.login(
        credentials.email,
        credentials.password
      )

      if (!result.success) {
        setError(result.error || 'Failed to sign in')
        logger.error('useAuth:login', 'Login failed', result.error)
        return { success: false, error: result.error }
      }

      // Update store with session
      if (result.data) {
        setUser(result.data.user)
        setSession(result.data.session)
      }

      logger.info('useAuth:login', 'Login successful')
      return { success: true, data: result.data }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      logger.error('useAuth:login', 'Unexpected login error', err)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (credentials: SignupCredentials) => {
    try {
      setLoading(true)
      clearError()

      const result = await authService.signup(
        credentials.email,
        credentials.password,
        credentials.fullName,
        credentials.phone
      )

      if (!result.success) {
        setError(result.error || 'Failed to sign up')
        logger.error('useAuth:signup', 'Signup failed', result.error)
        return { success: false, error: result.error }
      }

      // Update store with session if available
      if (result.data) {
        setUser(result.data.user)
        setSession(result.data.session)
      }

      logger.info('useAuth:signup', 'Signup successful')
      return { success: true, data: result.data }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      logger.error('useAuth:signup', 'Unexpected signup error', err)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      clearError()

      const result = await authService.logout()

      if (!result.success) {
        const message = result.error || 'Failed to sign out'

        // Firefox sometimes reports "Auth session missing!" even though we want to
        // treat the user as logged out on the client. In that case, clear client
        // auth state and treat this as a soft-success so navigation can proceed.
        if (message.includes('Auth session missing')) {
          logger.warn('useAuth:logout', 'Session already missing, clearing client auth state')
          clearAuth()
          return { success: true }
        }

        setError(message)
        logger.error('useAuth:logout', 'Logout failed', result.error)
        return { success: false, error: result.error }
      }

      // Clear store
      clearAuth()

      logger.info('useAuth:logout', 'Logout successful')
      return { success: true }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      logger.error('useAuth:logout', 'Unexpected logout error', err)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    signup,
    logout,
  }
}
