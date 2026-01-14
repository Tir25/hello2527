import { useEffect, useState } from 'react'
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
import { AuthLayout } from '@/components/layout/AuthLayout'
import FormAlert from '@/components/ui/FormAlert'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { loading: authLoading, error: globalError, clearError } = useAuthStore()

  useEffect(() => () => clearError(), [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    setShowResendConfirmation(false)
    setResendMessage(null)

    try {
      const result = await login({
        email: data.email,
        password: data.password,
      })

      if (!result.success) {
        const normalizedError = result.error?.toLowerCase() ?? ''
        const requiresConfirmation =
          normalizedError.includes('email not confirmed') ||
          normalizedError.includes('email_not_confirmed')

        if (requiresConfirmation) {
          setUserEmail(data.email)
          setShowResendConfirmation(true)
          setError('root', {
            message: 'Please confirm your email before logging in.',
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
    <AuthLayout title="Welcome back" subtitle="Sign in to continue the conversation">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 sm:space-y-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {globalError && <FormAlert variant="error" message={globalError} />}

        {errors.root && (
          <FormAlert variant="error" message={errors.root.message}>
            {showResendConfirmation && (
              <ResendConfirmationNotice
                onResend={handleResendConfirmation}
                isLoading={resendLoading}
                message={resendMessage}
              />
            )}
          </FormAlert>
        )}

        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
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

        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
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
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
            {...register('password')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button type="submit" variant="primary" isLoading={authLoading} className="w-full">
            Sign In
          </Button>
        </motion.div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center text-sm text-white/70"
      >
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-cyan-200 hover:text-cyan-100 underline underline-offset-2 transition-colors"
        >
          Create one
        </Link>
      </motion.div>
    </AuthLayout>
  )
}

const ResendConfirmationNotice = ({
  onResend,
  isLoading,
  message,
}: {
  onResend: () => Promise<void> | void
  isLoading: boolean
  message: string | null
}) => (
  <div className="mt-3 space-y-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs text-white/90">
    <p className="text-sm text-cyan-100">
      Your email is not confirmed yet. Tap below and follow the link in your inbox to activate your account.
    </p>
    <Button
      type="button"
      variant="ghost"
      onClick={onResend}
      isLoading={isLoading}
      className="w-full border border-cyan-300/40 text-cyan-50"
    >
      Resend confirmation email
    </Button>
    {message && (
      <p className={`text-xs ${message.includes('sent') ? 'text-emerald-200' : 'text-red-200'}`}>
        {message}
      </p>
    )}
  </div>
)

export default LoginPage

