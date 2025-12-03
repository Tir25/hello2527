import { type ReactNode } from 'react'
import { motion, type MotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

type ConflictingProps = 'children' | 'style'

type MotionCardProps = Omit<MotionProps, ConflictingProps>

export interface GlassCardProps extends MotionCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
}

const GlassCard = ({
  children,
  className,
  variant = 'default',
  whileHover,
  whileTap,
  ...props
}: GlassCardProps) => {
  const baseStyles = 'backdrop-blur-xl border rounded-2xl shadow-xl'
  
  const variants = {
    default: 'bg-white/10 border-white/10',
    elevated: 'bg-white/20 border-white/20 shadow-2xl',
    subtle: 'bg-white/5 border-white/5 shadow-lg',
  }

  const motionProps: MotionProps = {
    whileHover: whileHover ?? { scale: 1.02 },
    whileTap: whileTap ?? { scale: 0.98 },
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

