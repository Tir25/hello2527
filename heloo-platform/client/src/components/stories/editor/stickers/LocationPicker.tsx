/**
 * Location Picker Component
 * Interactive location search using Nominatim API
 *
 * @module components/stories/editor/stickers/LocationPicker
 */

import { memo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Search, Loader2, Navigation } from 'lucide-react'
import { searchLocations, type LocationData } from '@/services/locations/locationService'
import { useDebounce } from '@/hooks/useDebounce'

interface LocationPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (location: LocationData) => void
}

const DEBOUNCE_MS = 500

const TYPE_COLORS = {
    city: 'text-red-500 bg-red-500/20',
    poi: 'text-blue-500 bg-blue-500/20',
    country: 'text-green-500 bg-green-500/20',
    state: 'text-purple-500 bg-purple-500/20',
    address: 'text-zinc-400 bg-zinc-500/20'
} as const

const getTypeColor = (type: LocationData['type']) =>
    TYPE_COLORS[type] || TYPE_COLORS.address

/**
 * Location picker modal with API search
 */
export const LocationPicker = memo(function LocationPicker({
    isOpen,
    onClose,
    onSelect
}: LocationPickerProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<LocationData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const debouncedQuery = useDebounce(query, DEBOUNCE_MS)

    // Search when debounced query changes
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([])
            return
        }

        const search = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await searchLocations(debouncedQuery)
                setResults(data)
                if (data.length === 0) {
                    setError('No locations found')
                }
            } catch {
                setError('Search failed. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        search()
    }, [debouncedQuery])

    const handleSelect = useCallback((location: LocationData) => {
        onSelect(location)
        setQuery('')
        setResults([])
        onClose()
    }, [onSelect, onClose])

    const handleClose = useCallback(() => {
        setQuery('')
        setResults([])
        setError(null)
        onClose()
    }, [onClose])

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
                                placeholder="Search cities, places..."
                                className="w-full bg-zinc-800 text-white pl-10 pr-10 py-3 rounded-xl
                                    placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            {loading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        {!query.trim() && (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                <Navigation className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm">Search for a location</p>
                            </div>
                        )}

                        {error && query.trim() && !loading && (
                            <p className="text-zinc-500 text-center py-8">{error}</p>
                        )}

                        {results.length > 0 && (
                            <>
                                <p className="text-zinc-500 text-xs uppercase mb-2 font-medium">
                                    Results
                                </p>
                                <div className="space-y-1">
                                    {results.map(location => (
                                        <button
                                            key={location.placeId}
                                            onClick={() => handleSelect(location)}
                                            className="w-full flex items-center gap-3 p-4 rounded-xl min-h-[56px]
                                                hover:bg-white/10 active:bg-white/20 transition-colors text-left group touch-manipulation"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(location.type)}`}>
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                                                    {location.name}
                                                </p>
                                                <p className="text-zinc-500 text-sm truncate">
                                                    {location.displayName}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
