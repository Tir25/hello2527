/**
 * Recent Searches Component
 * 
 * Responsibility: Display recent search chips with clear all functionality
 * Layer: UI Component (Presentational)
 * 
 * Features:
 * - Display recent searches as clickable chips
 * - Remove individual searches
 * - Clear all history button
 * - Loading state for cloud sync
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Search, X, Trash2, Loader2 } from 'lucide-react'
import type { SearchHistoryItem } from '@/lib/services/searchHistory'

interface RecentSearchesProps {
    searches: SearchHistoryItem[]
    loading?: boolean
    onSearch: (query: string) => void
    onClear: (query: string) => void
    onClearAll?: () => void
}

export const RecentSearches = memo(({
    searches,
    loading = false,
    onSearch,
    onClear,
    onClearAll
}: RecentSearchesProps) => {
    const [showConfirm, setShowConfirm] = useState(false)

    // Show loading skeleton while fetching from cloud
    if (loading) {
        return (
            <div className="flex-none px-4 sm:px-6 pb-3">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Loader2 size={14} className="text-gray-400 animate-spin" />
                        <span className="text-xs font-medium text-gray-500">Loading history...</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-8 w-24 rounded-full bg-gray-100 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (searches.length === 0) return null

    const handleClearAll = () => {
        if (showConfirm) {
            onClearAll?.()
            setShowConfirm(false)
        } else {
            setShowConfirm(true)
            // Auto-hide confirmation after 3 seconds
            setTimeout(() => setShowConfirm(false), 3000)
        }
    }

    return (
        <div className="flex-none px-4 sm:px-6 pb-3">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">Recent searches</span>
                    </div>

                    {/* Clear All Button */}
                    {onClearAll && searches.length > 0 && (
                        <AnimatePresence mode="wait">
                            {showConfirm ? (
                                <motion.button
                                    key="confirm"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    type="button"
                                    onClick={handleClearAll}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={12} />
                                    <span>Confirm clear</span>
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="clear"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    type="button"
                                    onClick={handleClearAll}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={12} />
                                    <span>Clear all</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {searches.slice(0, 8).map((item) => (
                            <motion.div
                                key={item.id || item.query}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                layout
                                role="button"
                                tabIndex={0}
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 border border-gray-200 text-sm text-gray-700 hover:bg-white/80 active:scale-95 transition-all cursor-pointer"
                                onClick={() => onSearch(item.query)}
                                onKeyDown={(e) => e.key === 'Enter' && onSearch(item.query)}
                            >
                                <Search size={12} className="text-gray-400" />
                                <span className="truncate max-w-[100px]">{item.query}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        onClear(item.query)
                                    }}
                                    className="ml-0.5 p-1 rounded-full hover:bg-gray-200 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                                    aria-label={`Remove ${item.query} from recent searches`}
                                >
                                    <X size={14} className="text-gray-400" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
})

RecentSearches.displayName = 'RecentSearches'
