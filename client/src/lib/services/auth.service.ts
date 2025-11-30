import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { loginSchema, signupApiSchema } from '@/lib/schemas'

export type LoginCredentials = z.infer<typeof loginSchema>
export type SignupCredentials = z.infer<typeof signupApiSchema>

interface AuthResponse {
  success: boolean
  error?: string
  data?: {
    user: SupabaseUser | null
    session: Session | null
  }
}

// Helper to format Zod validation errors
const formatZodErrors = (error: z.ZodError): string => {
  return error.issues.map(issue => issue.message).join(', ')
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const validated = loginSchema.parse({ email, password })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      })

      if (error) {
        logger.error('auth:login', 'Failed to sign in', error)
        return {
          success: false,
          error: error.message || 'Failed to sign in',
        }
      }

      logger.info('auth:login', 'User signed in successfully')
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      }
    } catch (error) {
      logger.error('auth:login', 'Login validation or request failed', error)
      return {
        success: false,
        error: error instanceof z.ZodError
          ? formatZodErrors(error)
          : 'An unexpected error occurred',
      }
    }
  },

  async signup(
    email: string,
    password: string,
    fullName: string,
    phone: string
  ): Promise<AuthResponse> {
    try {
      // Validate using signupApiSchema (without confirmPassword)
      const validated = signupApiSchema.parse({ email, password, fullName, phone })

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,  // FIXED: snake_case for database trigger
            phone: validated.phone,
          },
        },
      })

      if (error) {
        logger.error('auth:signup', 'Failed to sign up', error)
        return {
          success: false,
          error: error.message || 'Failed to sign up',
        }
      }

      logger.info('auth:signup', 'User signed up successfully')
      
      // Auto-confirm email for development (if user was created but email not confirmed)
      // This ensures users can login immediately after signup
      if (data.user && !data.session) {
        try {
          // Call server endpoint to auto-confirm email
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
          const confirmResponse = await fetch(`${apiUrl}/api/auth/confirm-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: data.user.id }),
          })
          
          if (confirmResponse.ok) {
            logger.info('auth:signup', 'Email auto-confirmed via server')
            // Try to get session again after confirmation
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData?.session) {
              return {
                success: true,
                data: {
                  user: data.user,
                  session: sessionData.session,
                },
              }
            }
          }
        } catch (confirmError) {
          // Log but don't fail signup if auto-confirmation fails
          logger.warn('auth:signup', 'Auto-confirmation failed, user can use resend email', confirmError)
        }
      }
      
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      }
    } catch (error) {
      logger.error('auth:signup', 'Signup validation or request failed', error)
      return {
        success: false,
        error: error instanceof z.ZodError
          ? formatZodErrors(error)
          : 'An unexpected error occurred',
      }
    }
  },

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        logger.error('auth:logout', 'Failed to sign out', error)
        return {
          success: false,
          error: error.message || 'Failed to sign out',
        }
      }

      logger.info('auth:logout', 'User signed out successfully')
      return { success: true }
    } catch (error) {
      logger.error('auth:logout', 'Logout request failed', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  },

  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        logger.error('auth:getCurrentUser', 'Failed to get current user', error)
        return { success: false, error: error.message }
      }

      return { success: true, user }
    } catch (error) {
      logger.error('auth:getCurrentUser', 'Get current user request failed', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        logger.error('auth:resendConfirmation', 'Failed to resend confirmation email', error)
        return {
          success: false,
          error: error.message || 'Failed to resend confirmation email',
        }
      }

      logger.info('auth:resendConfirmation', 'Confirmation email resent successfully')
      return { success: true }
    } catch (error) {
      logger.error('auth:resendConfirmation', 'Unexpected error resending confirmation', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  },
}
