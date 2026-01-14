/**
 * Error Message Component
 * 
 * Animated error message display.
 */

import { motion, AnimatePresence } from 'framer-motion'

interface ErrorMessageProps {
    error: string | null
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => (
    <AnimatePresence>
        {error && (
            <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 text-sm text-center"
            >
                {error}
            </motion.p>
        )}
    </AnimatePresence>
)
