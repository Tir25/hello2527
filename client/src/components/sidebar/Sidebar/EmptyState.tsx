import { motion } from 'framer-motion'
import { Search, MessageCircle } from 'lucide-react'

/**
 * Empty State Component
 * 
 * Responsibility: Displays empty states for search/conversations
 * Layer: UI Component (View)
 */

interface EmptyStateProps {
    isSearch: boolean
}

export const EmptyState = ({ isSearch }: EmptyStateProps) => {
    if (isSearch) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Search size={28} className="text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No users found</p>
                <p className="text-xs text-gray-500">Try a different search term</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 flex items-center justify-center mb-4">
                <MessageCircle size={36} className="text-purple-500" />
            </div>
            <p className="text-base font-semibold text-gray-800 mb-2">No chats yet</p>
            <p className="text-sm text-gray-500 leading-relaxed">
                Search for a friend above to start your first conversation!
            </p>
            <motion.div
                className="mt-4 flex items-center gap-1 text-purple-500"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                <Search size={14} />
                <span className="text-xs font-medium">Type a name above</span>
            </motion.div>
        </div>
    )
}
