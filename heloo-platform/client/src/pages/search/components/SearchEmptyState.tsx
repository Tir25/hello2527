/**
 * Search Empty State Component
 * 
 * Responsibility: Display empty/no results states
 * Layer: UI Component (Presentational)
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface SearchEmptyStateProps {
    hasQuery: boolean
}

export const SearchEmptyState = memo(({ hasQuery }: SearchEmptyStateProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
        >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
                <Search size={36} className="text-gray-300" />
            </div>

            {hasQuery ? (
                <>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No users found</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Try searching with a different name or username
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Find people</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Search by name or username to connect
                    </p>
                </>
            )}
        </motion.div>
    )
})

SearchEmptyState.displayName = 'SearchEmptyState'
