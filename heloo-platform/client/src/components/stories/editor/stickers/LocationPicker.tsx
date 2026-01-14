/**
 * Location Picker Component
 * Interactive location search for story stickers
 *
 * @module components/stories/editor/stickers/LocationPicker
 */

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Search } from 'lucide-react'

interface LocationPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (location: string) => void
}

/** Mock popular locations for demo */
const POPULAR_LOCATIONS = [
    'New York, NY',
    'Los Angeles, CA',
    'London, UK',
    'Paris, France',
    'Tokyo, Japan',
    'Dubai, UAE',
    'Sydney, Australia',
    'Mumbai, India',
]

/**
 * Location picker modal with search
 */
export const LocationPicker = memo(function LocationPicker({
    isOpen,
    onClose,
    onSelect
}: LocationPickerProps) {
    const [query, setQuery] = useState('')

    const handleSelect = useCallback((location: string) => {
        onSelect(location)
        setQuery('')
        onClose()
    }, [onSelect, onClose])

    const handleClose = useCallback(() => {
        setQuery('')
        onClose()
    }, [onClose])

    // Filter locations based on query
    const filteredLocations = query
        ? POPULAR_LOCATIONS.filter(l =>
            l.toLowerCase().includes(query.toLowerCase())
        )
        : POPULAR_LOCATIONS

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col"
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-4 border-b border-white/10"
                        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
                    >
                        <h2 className="text-white font-bold text-lg">Add Location</h2>
                        <button
                            onClick={handleClose}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors touch-manipulation"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search locations..."
                                className="w-full bg-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl
                                    placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Location List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <p className="text-zinc-500 text-xs uppercase mb-2 font-medium">
                            {query ? 'Search Results' : 'Popular Locations'}
                        </p>
                        <div className="space-y-1">
                            {filteredLocations.map(location => (
                                <button
                                    key={location}
                                    onClick={() => handleSelect(location)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl min-h-[56px]
                                        hover:bg-white/10 active:bg-white/20 transition-colors text-left group touch-manipulation"
                                >
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="text-white group-hover:text-red-400 transition-colors">
                                        {location}
                                    </span>
                                </button>
                            ))}
                            {query && filteredLocations.length === 0 && (
                                <p className="text-zinc-500 text-center py-8">
                                    No locations found for "{query}"
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
