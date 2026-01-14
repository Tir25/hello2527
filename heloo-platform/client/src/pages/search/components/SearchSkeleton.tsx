/**
 * Search Skeleton Component
 * 
 * Responsibility: Loading skeleton for search results
 * Layer: UI Component (Presentational)
 */

import { memo } from 'react'
import { motion } from 'framer-motion'

export const SearchSkeleton = memo(() => (
    <div className="space-y-2" aria-label="Loading results" role="status">
        {[0, 1, 2, 3, 4].map((index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-white/60 to-gray-50/40 border border-white/30 shadow-sm"
            >
                {/* Avatar skeleton */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse flex-shrink-0" />

                {/* Content skeleton */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div
                        className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-pulse"
                        style={{ width: `${55 + (index % 3) * 15}%` }}
                    />
                    <div
                        className="h-3 bg-gray-200/60 rounded-md animate-pulse"
                        style={{ width: `${40 + (index % 2) * 20}%` }}
                    />
                    {/* Bio skeleton line */}
                    <div
                        className="h-2.5 bg-gray-100/50 rounded-md animate-pulse"
                        style={{ width: `${65 + (index % 4) * 8}%` }}
                    />
                </div>

                {/* Button skeleton */}
                <div className="w-20 h-8 bg-gray-200/40 rounded-xl animate-pulse flex-shrink-0" />
            </motion.div>
        ))}
        <span className="sr-only">Loading search results...</span>
    </div>
))

SearchSkeleton.displayName = 'SearchSkeleton'

