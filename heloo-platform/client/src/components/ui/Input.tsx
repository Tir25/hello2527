import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'ref'> {
  label?: string
  error?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  rightAction?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      iconPosition = 'left',
      rightAction,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <motion.label
            htmlFor={props.id}
            className="block text-sm font-medium text-white/90 mb-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <motion.div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Icon size={20} />
            </motion.div>
          )}
          <div className="relative group">
            <input
              ref={ref}
              type={type}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-white/10 backdrop-blur-sm',
                'border border-white/20',
                'text-white placeholder:text-white/50',
                'focus:outline-none focus:ring-2 focus:ring-white/30',
                'focus:border-white/40',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'group-focus-within:scale-[1.01]',
                Icon && iconPosition === 'left' && 'pl-12',
                Icon && iconPosition === 'right' && !rightAction && 'pr-12',
                rightAction && 'pr-12',
                error && 'border-red-400/50 focus:ring-red-400/30',
                className
              )}
              {...props}
            />
          </div>
          {Icon && iconPosition === 'right' && !rightAction && (
            <motion.div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Icon size={20} />
            </motion.div>
          )}
          {rightAction && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {rightAction}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            className="mt-1.5 text-sm text-red-300 font-medium"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    )
  }
)

Input.displayName = 'Input'

export default Input

