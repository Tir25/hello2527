/**
 * ImageLightbox Component
 * 
 * Full-screen modal for viewing images at full size.
 * Extracted from MessageBubble for reusability.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ImageLightboxProps {
    imageUrl: string | null
    onClose: () => void
}

export const ImageLightbox = ({ imageUrl, onClose }: ImageLightboxProps) => {
    if (!imageUrl) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-label="Image lightbox"
            >
                {/* Close Button */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors border border-white/20"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    aria-label="Close lightbox"
                    type="button"
                >
                    <X size={24} className="text-white" aria-hidden="true" />
                </motion.button>

                {/* Image */}
                <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    src={imageUrl}
                    alt="Full size image"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                />
            </motion.div>
        </AnimatePresence>
    )
}
