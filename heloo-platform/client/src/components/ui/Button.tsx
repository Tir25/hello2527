import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

type ConflictingProps =
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onAnimationStart'
  | 'onAnimationComplete'
  | 'children'
  | 'style'

type MotionButtonProps = Omit<MotionProps, ConflictingProps>

type ButtonHTMLProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingProps>

export type ButtonProps = ButtonHTMLProps &
  MotionButtonProps & {
    variant?: 'primary' | 'secondary' | 'ghost'
    isLoading?: boolean
    children?: ReactNode
  }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  isLoading = false,
  className,
  children,
  disabled,
  whileHover,
  whileTap,
  ...props
}, ref) => {
  const baseStyles =
    'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-purple-500/50 focus:ring-purple-500',
    secondary:
      'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-400',
    ghost:
      'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-400',
  }

  const motionProps: MotionProps = {
    whileHover: whileHover ?? { scale: 1.02 },
    whileTap: whileTap ?? { scale: 0.98 },
  }

  return (
    <motion.button
      ref={ref}
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...motionProps}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button

