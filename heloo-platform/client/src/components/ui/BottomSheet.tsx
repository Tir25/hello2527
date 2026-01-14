import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface BottomSheetOption {
    label: string
    onClick: () => void
    variant?: 'default' | 'danger'
    icon?: React.ReactNode
    disabled?: boolean
}

export interface BottomSheetProps {
    isOpen: boolean
    title?: string
    options: BottomSheetOption[]
    onClose: () => void
}

/**
 * Bottom Sheet Component
 * 
 * Mobile-optimized alternative to context menus.
 * Slides up from the bottom with swipe-to-dismiss gesture.
 * 
 * Features:
 * - Swipe down to dismiss
 * - Backdrop click to close
 * - Escape key to close
 * - Reduced motion support
 * - Safe area padding for notched devices
 */
export const BottomSheet = ({ isOpen, title, options, onClose }: BottomSheetProps) => {
    const sheetRef = useRef<HTMLDivElement>(null)
    const prefersReducedMotion = useReducedMotion()

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    // Prevent body scroll when open
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

    // Handle swipe down to dismiss
    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose()
            }
        },
        [onClose]
    )

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
                        transition={{
                            type: prefersReducedMotion ? 'tween' : 'spring',
                            damping: 30,
                            stiffness: 300,
                            duration: prefersReducedMotion ? 0.15 : undefined
                        }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl shadow-2xl safe-bottom"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title || 'Actions menu'}
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                        )}

                        {/* Options */}
                        <div className="px-3 py-2" role="menu">
                            {options.map((option, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    role="menuitem"
                                    disabled={option.disabled}
                                    onClick={() => {
                                        if (!option.disabled) {
                                            option.onClick()
                                            onClose()
                                        }
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-4 rounded-xl min-h-[56px]',
                                        'text-left text-base font-medium',
                                        'transition-colors duration-100',
                                        option.disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-gray-100 active:bg-gray-50 active:scale-[0.98] cursor-pointer',
                                        option.variant === 'danger'
                                            ? 'text-red-600'
                                            : 'text-gray-800'
                                    )}
                                >
                                    {option.icon && (
                                        <span className={cn(
                                            'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full',
                                            option.variant === 'danger' ? 'bg-red-50' : 'bg-gray-100'
                                        )}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span className="flex-1">{option.label}</span>
                                    {option.disabled && (
                                        <span className="text-xs text-gray-400">Processing...</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Cancel Button */}
                        <div className="px-3 pb-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 active:scale-[0.98] transition-all min-h-[56px]"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
