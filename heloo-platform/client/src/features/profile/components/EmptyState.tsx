/**
 * EmptyState Component
 * 
 * Responsibility: Display empty state with illustration and CTA
 * Layer: UI (Dumb Component)
 * 
 * Use when content area has no items to display
 */

import { motion } from 'framer-motion'

interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            {/* Icon Container */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                <div className="text-purple-500">
                    {icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>

            {/* Description */}
            <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>

            {/* Optional Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    )
}
