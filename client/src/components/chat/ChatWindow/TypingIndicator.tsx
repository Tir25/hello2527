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
                className="flex items-center gap-2 text-sm text-gray-600"
            >
                <span className="font-medium">{userName}</span>
                <span>is typing</span>
                <div className="typing-dots">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </div>
            </motion.div>
        </div>
    )
}
