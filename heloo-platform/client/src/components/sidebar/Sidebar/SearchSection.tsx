import { motion, AnimatePresence } from 'framer-motion'
import { Users } from 'lucide-react'
import { SearchBar } from '@/components/features/SearchBar'

/**
 * Search Section Component
 * 
 * Responsibility: Search bar with mode indicator
 * Layer: UI Component (View)
 */

interface SearchSectionProps {
    searchQuery: string
    onChange: (value: string) => void
    showSearchResults: boolean
    onClearSearch: () => void
}

export const SearchSection = ({
    searchQuery,
    onChange,
    showSearchResults,
    onClearSearch,
}: SearchSectionProps) => {
    return (
        <div className="p-4 border-b border-white/20">
            <SearchBar value={searchQuery} onChange={onChange} placeholder="Search conversations..." />

            <AnimatePresence>
                {showSearchResults && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 mt-2 px-2"
                    >
                        <Users size={14} className="text-purple-500" />
                        <span className="text-xs text-purple-600 font-medium">Local Search</span>
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                            Clear
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
