/**
 * ConfirmDialog Component
 * 
 * Responsibility: Display confirmation dialog for destructive actions
 * Layer: UI (Dumb Component)
 */

import { RefObject } from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import type { ConfirmDialogState } from '../../types/profile.types'

interface ConfirmDialogProps {
  dialog: ConfirmDialogState
  loading: boolean
  dialogRef: RefObject<HTMLDivElement | null>
  cancelButtonRef: RefObject<HTMLButtonElement | null>
  confirmButtonRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

export const ConfirmDialog = ({
  dialog,
  loading,
  dialogRef,
  cancelButtonRef,
  confirmButtonRef,
  onClose,
}: ConfirmDialogProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !loading) {
          onClose()
        }
      }}
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-xl bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-dialog-title"
          className={`text-xl font-bold mb-2 ${dialog.variant === 'danger' ? 'text-red-600' : 'text-orange-600'
            }`}
        >
          {dialog.title}
        </h3>
        <p id="confirm-dialog-message" className="text-gray-600 mb-6">
          {dialog.message}
        </p>
        <div className="flex gap-3">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            ref={confirmButtonRef}
            variant="primary"
            onClick={async () => {
              await dialog.onConfirm()
            }}
            isLoading={loading}
            disabled={loading}
            className={`flex-1 ${dialog.variant === 'danger'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-orange-500 hover:bg-orange-600'
              }`}
            aria-label={dialog.confirmLabel}
          >
            {dialog.confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
