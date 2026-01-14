/**
 * Delete Confirm Modal
 * Reusable confirmation modal for story deletion
 * 
 * @module components/stories/DeleteConfirmModal
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteConfirmModalProps {
    isOpen: boolean
    isDeleting: boolean
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Modal to confirm story deletion
 */
export const DeleteConfirmModal = memo(function DeleteConfirmModal({
    isOpen,
    isDeleting,
    onConfirm,
    onCancel
}: DeleteConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-zinc-900 rounded-2xl p-6 max-w-xs w-full text-center"
                    >
                        <Trash2 className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <h3 className="text-white font-semibold mb-2">Delete Story?</h3>
                        <p className="text-zinc-400 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
