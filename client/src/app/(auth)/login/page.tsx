import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/lib/schemas'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import { authService } from '@/lib/services/auth.service'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { loading: authLoading, error: globalError, clearError } = useAuthStore()

  // Clear global error when component mounts or when user starts typing
  useEffect(() => {
    return () => {
      // Clear error when component unmounts
      clearError()
    }
  }, [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    // Clear global error when form is submitted
    clearError()
    setShowResendConfirmation(false)
    setResendMessage(null)
    
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      })

      if (!result.success) {
        // Check if error is email confirmation
        const isEmailNotConfirmed = 
          result.error?.toLowerCase().includes('email not confirmed') ||
          result.error?.toLowerCase().includes('email_not_confirmed')
        
        if (isEmailNotConfirmed) {
          // Store email for resend functionality
          setUserEmail(data.email)
          setShowResendConfirmation(true)
          setError('root', {
            message: 'Please confirm your email before logging in. Check your inbox for a confirmation link.',
          })
        } else {
          setError('root', {
            message: result.error || 'Failed to sign in',
          })
        }
        logger.error('login:onSubmit', 'Login failed', result.error)
        return
      }

      logger.info('login:onSubmit', 'Login successful')
      // The auth listener will pick up the session change and handle navigation
      // But we can also navigate immediately for better UX
      navigate('/')
    } catch (error) {
      logger.error('login:onSubmit', 'Unexpected login error', error)
      setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  const handleResendConfirmation = async () => {
    if (!userEmail) return

    setResendLoading(true)
    setResendMessage(null)

    try {
      const result = await authService.resendConfirmationEmail(userEmail)

      if (result.success) {
        setResendMessage('Confirmation email sent! Please check your inbox.')
        logger.info('login:resendConfirmation', 'Confirmation email resent')
      } else {
        setResendMessage(result.error || 'Failed to resend confirmation email')
        logger.error('login:resendConfirmation', 'Failed to resend', result.error)
      }
    } catch (error) {
      setResendMessage('An unexpected error occurred. Please try again.')
      logger.error('login:resendConfirmation', 'Unexpected error', error)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-cyan-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      </div>

      {/* Floating Blobs Animation */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-violet-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent"
            >
              He'loo
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 text-base sm:text-lg"
            >
              Welcome back! Sign in to continue
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            {/* Display global error from Zustand store */}
            {globalError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-sm"
              >
                {globalError}
              </motion.div>
            )}
            {/* Display form validation errors */}
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-sm space-y-2"
              >
                <p>{errors.root.message}</p>
                {showResendConfirmation && (
                  <div className="mt-3 pt-3 border-t border-red-400/30">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResendConfirmation}
                      isLoading={resendLoading}
                      className="w-full text-sm text-cyan-300 hover:text-cyan-200 border border-cyan-400/50 hover:border-cyan-400/70"
                    >
                      Resend Confirmation Email
                    </Button>
                    {resendMessage && (
                      <p className={`mt-2 text-xs ${
                        resendMessage.includes('sent') 
                          ? 'text-green-300' 
                          : 'text-red-300'
                      }`}>
                        {resendMessage}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                icon={Mail}
                iconPosition="left"
                error={errors.email?.message}
                {...register('email')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                icon={Lock}
                iconPosition="left"
                error={errors.password?.message}
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                }
                {...register('password')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                variant="primary"
                isLoading={authLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </motion.div>
          </form>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 sm:mt-6 text-center"
          >
            <p className="text-white/70 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors underline underline-offset-2"
              >
                Sign Up
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage

