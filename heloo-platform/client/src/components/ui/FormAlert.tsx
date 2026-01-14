import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

type FormAlertVariant = 'info' | 'error' | 'success' | 'warning'

export interface FormAlertProps {
  variant?: FormAlertVariant
  message?: string | ReactNode
  children?: ReactNode
  className?: string
}

const variantStyles: Record<FormAlertVariant, string> = {
  info: 'bg-white/15 border-white/30 text-white',
  error: 'bg-red-500/15 border-red-400/50 text-red-100',
  success: 'bg-emerald-500/15 border-emerald-400/50 text-emerald-100',
  warning: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100',
}

export const FormAlert = ({
  variant = 'info',
  message,
  children,
  className,
}: FormAlertProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm backdrop-blur-lg shadow-inner shadow-black/10',
        variantStyles[variant],
        className
      )}
    >
      {message && <p>{message}</p>}
      {children}
    </motion.div>
  )
}

FormAlert.displayName = 'FormAlert'

export default FormAlert


