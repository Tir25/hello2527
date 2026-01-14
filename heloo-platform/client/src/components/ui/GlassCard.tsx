import { type ReactNode } from 'react'
import { motion, type MotionProps, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

type ConflictingProps = 'children' | 'style'

type MotionCardProps = Omit<MotionProps, ConflictingProps>

export interface GlassCardProps extends MotionCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
  /** Disable blur for performance-critical contexts */
  disableBlur?: boolean
  /** Optional click handler */
  onClick?: () => void
}

const GlassCard = ({
  children,
  className,
  variant = 'default',
  disableBlur = false,
  whileHover,
  whileTap,
  ...props
}: GlassCardProps) => {
  const prefersReducedMotion = useReducedMotion()

  // Performance: Use lighter blur (lg instead of xl) and allow disabling
  const baseStyles = disableBlur
    ? 'border rounded-2xl shadow-xl'
    : 'backdrop-blur-lg border rounded-2xl shadow-xl'

  // Slightly higher opacity for solid appearance when blur is reduced
  const variants = {
    default: 'bg-white/20 border-white/15',
    elevated: 'bg-white/30 border-white/25 shadow-2xl',
    subtle: 'bg-white/10 border-white/10 shadow-lg',
  }

  // Disable scale animations by default for better mobile performance
  const motionProps: MotionProps = {
    whileHover: prefersReducedMotion ? undefined : (whileHover ?? undefined),
    whileTap: prefersReducedMotion ? undefined : (whileTap ?? undefined),
  }

  return (
    <motion.div
      className={cn(baseStyles, variants[variant], className)}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  )
}

GlassCard.displayName = 'GlassCard'

export default GlassCard

