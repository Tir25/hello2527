/**
 * Location Results Component
 * Displays location search results
 * 
 * @module pages/search/components/LocationResults
 */

import { memo } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import type { LocationData } from '@/services/locations'

interface LocationResultsProps {
    locations: LocationData[]
    loading: boolean
    hasQuery: boolean
    onSelect: (location: LocationData) => void
}

const TYPE_COLORS = {
    city: 'text-red-500 bg-red-500/20',
    poi: 'text-blue-500 bg-blue-500/20',
    country: 'text-green-500 bg-green-500/20',
    state: 'text-purple-500 bg-purple-500/20',
    address: 'text-zinc-400 bg-zinc-500/20'
} as const

export const LocationResults = memo(function LocationResults({
    locations,
    loading,
    hasQuery,
    onSelect
}: LocationResultsProps) {
    // Loading skeleton
    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-zinc-800 rounded w-32" />
                            <div className="h-3 bg-zinc-800 rounded w-48" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Empty state
    if (!hasQuery) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
                <Navigation className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Search for a location</p>
            </div>
        )
    }

    // No results
    if (hasQuery && locations.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
                <MapPin className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No locations found</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
            <p className="text-zinc-500 text-xs uppercase mb-2 font-medium px-2">
                Locations
            </p>
            <div className="space-y-1">
                {locations.map(location => (
                    <button
                        key={location.placeId}
                        onClick={() => onSelect(location)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl
                            hover:bg-zinc-800/50 active:bg-zinc-800 transition-colors text-left"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${TYPE_COLORS[location.type] || TYPE_COLORS.address}`}>
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                                {location.name}
                            </p>
                            <p className="text-zinc-500 text-sm truncate">
                                {location.displayName}
                            </p>
                        </div>
                        {location.id && (
                            <span className="text-xs text-zinc-600">
                                {/* Show story count if from DB */}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
})
