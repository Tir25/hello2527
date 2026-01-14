import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from './GlassCard'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirm Dialog Component
 * 
 * A glassmorphism confirmation dialog to replace native confirm()
 * Supports keyboard navigation and accessibility
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus cancel button by default (safer UX)
      setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        // Only confirm on Enter if focus is on confirm button
        if (document.activeElement === confirmButtonRef.current) {
          onConfirm()
        }
      } else if (e.key === 'Tab') {
        // Trap focus within dialog
        if (e.shiftKey) {
          if (document.activeElement === cancelButtonRef.current) {
            e.preventDefault()
            confirmButtonRef.current?.focus()
          }
        } else {
          if (document.activeElement === confirmButtonRef.current) {
            e.preventDefault()
            cancelButtonRef.current?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onCancel])

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Use portal to render at document.body level, preventing clipping by parent containers
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full max-w-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-message"
            >
              <GlassCard
                variant="elevated"
                className="p-6 shadow-2xl border-white/30"
              >
                <div className="flex items-start gap-4 mb-6">
                  {variant === 'danger' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3
                      id="confirm-dialog-title"
                      className="text-lg font-semibold text-gray-800 mb-2"
                    >
                      {title}
                    </h3>
                    <p
                      id="confirm-dialog-message"
                      className="text-sm text-gray-600 leading-relaxed"
                    >
                      {message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    ref={cancelButtonRef}
                    type="button"
                    onClick={onCancel}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                      'bg-white/20 hover:bg-white/30 text-gray-700',
                      'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2'
                    )}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    ref={confirmButtonRef}
                    type="button"
                    onClick={onConfirm}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2',
                      variant === 'danger'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    )}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
