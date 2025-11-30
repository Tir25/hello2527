import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { signupSchema, type SignupFormData } from '@/lib/schemas'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signup } = useAuth()
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
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    // Clear global error when form is submitted
    clearError()
    
    try {
      setSuccessMessage(null)

      const result = await signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      })

      if (!result.success) {
        // Error is already set in the store by useAuth hook
        // Also set it in form for immediate display
        setError('root', {
          message: result.error || 'Failed to sign up',
        })
        logger.error('signup:onSubmit', 'Signup failed', result.error)
        return
      }

      logger.info('signup:onSubmit', 'Signup successful')

      // Check if email confirmation is required
      // If session is null, user needs to confirm email
      if (!result.data?.session) {
        // Clear any previous errors
        setError('root', { message: '' })
        // Show success message for email confirmation
        setSuccessMessage('Please check your email to confirm your account.')
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        // User is automatically signed in, redirect to home
        navigate('/')
      }
    } catch (error) {
      logger.error('signup:onSubmit', 'Unexpected signup error', error)
      setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      })
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
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10">
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
              Create your account to get started
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-green-500/20 border border-green-400/50 text-green-200 text-sm"
              >
                {successMessage}
              </motion.div>
            )}
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
                className="p-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-sm"
              >
                {errors.root.message}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                id="fullName"
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                icon={User}
                iconPosition="left"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
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
                id="phone"
                type="tel"
                label="Phone Number"
                placeholder="Enter your phone number"
                icon={Phone}
                iconPosition="left"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Confirm your password"
                icon={Lock}
                iconPosition="left"
                error={errors.confirmPassword?.message}
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                }
                {...register('confirmPassword')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button
                type="submit"
                variant="primary"
                isLoading={authLoading}
                className="w-full"
              >
                Sign Up
              </Button>
            </motion.div>
          </form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 sm:mt-6 text-center"
          >
            <p className="text-white/70 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors underline underline-offset-2"
              >
                Login
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default SignupPage
