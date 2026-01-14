import { motion } from 'framer-motion'

/**
 * Typing Indicator Component
 * 
 * Responsibility: Displays when user is typing
 * Layer: UI Component (View)
 * 
 * Pure presentational component with Liquid Glass styling
 */

interface TypingIndicatorProps {
    userName: string
}

export const TypingIndicator = ({ userName }: TypingIndicatorProps) => {
    return (
        <div className="flex-none px-4 py-2">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="inline-flex items-center gap-2 text-base sm:text-sm text-gray-600 bg-white/60 px-4 py-2 rounded-full shadow-sm border border-white/30"
            >
                <span className="font-medium text-gray-700">{userName}</span>
                <span className="text-gray-500">is typing</span>
                <div className="typing-dots">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </div>
            </motion.div>
        </div>
    )
}
