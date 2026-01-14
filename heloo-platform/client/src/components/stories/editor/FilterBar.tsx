/**
 * Filter Bar Component
 * Horizontal scrollable filter selector with image previews
 * 
 * @module components/stories/editor/FilterBar
 */

import { memo } from 'react'
import { FILTERS } from '@/constants/storyConstants'

interface FilterBarProps {
    activeFilter: string
    mediaPreview?: string | null
    onFilterChange: (filter: string) => void
}

/**
 * Horizontal filter scroll with image previews
 */
export const FilterBar = memo(function FilterBar({
    activeFilter,
    mediaPreview,
    onFilterChange
}: FilterBarProps) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x px-2 -webkit-overflow-scrolling-touch">
            {FILTERS.map(filter => (
                <button
                    key={filter.name}
                    onClick={() => onFilterChange(filter.value)}
                    className="flex flex-col items-center gap-2 min-w-[72px] snap-center touch-manipulation"
                >
                    <div
                        className={`w-16 h-16 rounded-full border-2 p-0.5 transition-colors overflow-hidden ${activeFilter === filter.value
                            ? 'border-blue-500'
                            : 'border-transparent'
                            }`}
                    >
                        {mediaPreview ? (
                            <img
                                src={mediaPreview}
                                alt={filter.name}
                                className="w-full h-full rounded-full object-cover"
                                style={{ filter: filter.value }}
                            />
                        ) : (
                            <div
                                className="w-full h-full rounded-full"
                                style={{ backgroundColor: filter.previewColor }}
                            />
                        )}
                    </div>
                    <span
                        className={`text-xs font-medium transition-colors ${activeFilter === filter.value
                            ? 'text-white'
                            : 'text-zinc-500'
                            }`}
                    >
                        {filter.name}
                    </span>
                </button>
            ))}
        </div>
    )
})
