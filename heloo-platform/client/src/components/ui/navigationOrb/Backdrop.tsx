/**
 * Backdrop Component
 * 
 * Soft blur overlay for mobile matching the glass aesthetic.
 */

import { motion, AnimatePresence } from 'framer-motion'
import type { BackdropProps } from './types'

/**
 * Mobile backdrop overlay.
 */
export const Backdrop: React.FC<BackdropProps> = ({ isVisible, onClick }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9998] md:hidden"
                    style={{
                        background: 'rgba(15,15,25,0.4)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClick}
                    aria-hidden="true"
                />
            )}
        </AnimatePresence>
    )
}
