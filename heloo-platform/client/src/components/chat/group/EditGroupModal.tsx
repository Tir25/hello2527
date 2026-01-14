/**
 * EditGroupModal Component
 * 
 * Modal for editing group name and description.
 * Admin-only access with validation.
 * 
 * Responsibility: Group settings editing UI
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Check } from 'lucide-react'
import { groupService } from '@/lib/services/group.service'
import { toast } from '@/store/toastStore'
import { triggerHaptic, useIsMobileUI } from '@/hooks/useIsMobileUI'
import { cn } from '@/utils/cn'

interface EditGroupModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string
    currentName: string
    currentDescription: string | null
    onUpdate: (name: string, description: string | null) => void
}

const MAX_NAME_LENGTH = 50
const MAX_DESCRIPTION_LENGTH = 200

export const EditGroupModal = ({
    isOpen,
    onClose,
    groupId,
    currentName,
    currentDescription,
    onUpdate,
}: EditGroupModalProps) => {
    const [name, setName] = useState(currentName)
    const [description, setDescription] = useState(currentDescription || '')
    const [saving, setSaving] = useState(false)
    const isMobile = useIsMobileUI()

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(currentName)
            setDescription(currentDescription || '')
        }
    }, [isOpen, currentName, currentDescription])

    const hasChanges = name !== currentName || description !== (currentDescription || '')
    const isValid = name.trim().length > 0 && name.length <= MAX_NAME_LENGTH

    const handleSave = useCallback(async () => {
        if (!isValid || !hasChanges) return

        triggerHaptic('light')
        setSaving(true)

        const result = await groupService.updateGroup(groupId, {
            name: name.trim(),
            description: description.trim() || null,
        })

        if (result.success) {
            toast.success('Group updated')
            onUpdate(name.trim(), description.trim() || null)
            onClose()
        } else {
            toast.error(result.error || 'Failed to update group')
        }

        setSaving(false)
    }, [groupId, name, description, isValid, hasChanges, onUpdate, onClose])

    const handleClose = useCallback(() => {
        if (!saving) {
            triggerHaptic('light')
            onClose()
        }
    }, [saving, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className={cn(
                            "fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden",
                            isMobile
                                ? "inset-x-4 bottom-4 top-auto max-h-[80vh]"
                                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
                        )}
                        initial={isMobile
                            ? { y: '100%', opacity: 0 }
                            : { scale: 0.95, opacity: 0 }
                        }
                        animate={isMobile
                            ? { y: 0, opacity: 1 }
                            : { scale: 1, opacity: 1 }
                        }
                        exit={isMobile
                            ? { y: '100%', opacity: 0 }
                            : { scale: 0.95, opacity: 0 }
                        }
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Group</h2>
                            <button
                                onClick={handleClose}
                                disabled={saving}
                                className="w-10 h-10 flex items-center justify-center rounded-full
                                          hover:bg-gray-100 active:scale-95 transition-all
                                          disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 space-y-4">
                            {/* Name input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Group Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter group name"
                                        maxLength={MAX_NAME_LENGTH}
                                        disabled={saving}
                                        className={cn(
                                            "w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900",
                                            "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                                            "disabled:opacity-50 transition-all placeholder:text-gray-400",
                                            name.trim().length === 0 && "border-red-300"
                                        )}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                        {name.length}/{MAX_NAME_LENGTH}
                                    </span>
                                </div>
                            </div>

                            {/* Description input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Description (optional)
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="What's this group about?"
                                        maxLength={MAX_DESCRIPTION_LENGTH}
                                        rows={3}
                                        disabled={saving}
                                        className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900
                                                  focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                                                  disabled:opacity-50 transition-all resize-none placeholder:text-gray-400"
                                    />
                                    <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                                        {description.length}/{MAX_DESCRIPTION_LENGTH}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={cn("p-4 border-t border-gray-100 flex-shrink-0", isMobile && "pb-safe-min")}>
                            <button
                                onClick={handleSave}
                                disabled={!isValid || !hasChanges || saving}
                                className={cn(
                                    "w-full py-3.5 px-4 rounded-xl font-medium",
                                    "bg-purple-600 text-white hover:bg-purple-700",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "active:scale-[0.98] transition-all",
                                    "flex items-center justify-center gap-2 min-h-[50px]"
                                )}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
