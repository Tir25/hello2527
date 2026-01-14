import { ReactNode, useEffect, useState } from 'react'
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
import { AuthLayout } from '@/components/layout/AuthLayout'
import FormAlert from '@/components/ui/FormAlert'

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { loading: authLoading, error: globalError, clearError } = useAuthStore()

  useEffect(() => () => clearError(), [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    clearError()
    setSuccessMessage(null)

    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      })

      if (!result.success) {
        setError('root', {
          message: result.error || 'Failed to sign up',
        })
        logger.error('register:onSubmit', 'Signup failed', result.error)
        return
      }

      logger.info('register:onSubmit', 'Signup successful')

      if (!result.data?.session) {
        setSuccessMessage('Please check your inbox to confirm your account.')
        setTimeout(() => navigate('/login'), 3000)
      } else {
        navigate('/')
      }
    } catch (error) {
      logger.error('register:onSubmit', 'Unexpected signup error', error)
      setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  return (
    <AuthLayout title="Create your He'loo account" subtitle="Secure, realtime conversations in seconds">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {successMessage && <FormAlert variant="success" message={successMessage} />}
        {globalError && <FormAlert variant="error" message={globalError} />}
        {errors.root && <FormAlert variant="error" message={errors.root.message} />}

        <FloatingInputMotion delay={0.2}>
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
        </FloatingInputMotion>

        <FloatingInputMotion delay={0.25}>
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
        </FloatingInputMotion>

        <FloatingInputMotion delay={0.3}>
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
        </FloatingInputMotion>

        <FloatingInputMotion delay={0.35}>
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
        </FloatingInputMotion>

        <FloatingInputMotion delay={0.4}>
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
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
            {...register('confirmPassword')}
          />
        </FloatingInputMotion>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Button type="submit" variant="primary" isLoading={authLoading} className="w-full">
            Create account
          </Button>
        </motion.div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-sm text-white/70"
      >
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-cyan-200 hover:text-cyan-100 underline underline-offset-2 transition-colors"
        >
          Sign in
        </Link>
      </motion.div>
    </AuthLayout>
  )
}

const FloatingInputMotion = ({ children, delay }: { children: ReactNode; delay: number }) => (
  <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
    {children}
  </motion.div>
)

export default RegisterPage
