import { ButtonHTMLAttributes, ReactNode } from 'react'
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

const Button = ({
  variant = 'primary',
  isLoading = false,
  className,
  children,
  disabled,
  whileHover,
  whileTap,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-purple-500/50 focus:ring-purple-500',
    secondary:
      'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 focus:ring-white/30',
    ghost:
      'bg-transparent text-white/80 hover:text-white hover:bg-white/10 focus:ring-white/30',
  }

  const motionProps: MotionProps = {
    whileHover: whileHover ?? { scale: 1.02 },
    whileTap: whileTap ?? { scale: 0.98 },
  }

  return (
    <motion.button
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
}

Button.displayName = 'Button'

export default Button

