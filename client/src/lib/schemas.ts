import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
})

// Base signup schema (without password confirmation)
const signupBaseSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
})

// Full signup schema with password confirmation validation
export const signupSchema = signupBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
)

// Signup schema for API calls (without confirmPassword)
export const signupApiSchema = signupBaseSchema.omit({ confirmPassword: true })

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>

