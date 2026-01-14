/**
 * MediaFilterTabs Component
 * 
 * Filter tab buttons for media gallery.
 * @module components/chat/gallery/MediaFilterTabs
 */

import { memo } from 'react'
import { Image, Video, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { MediaFilter } from './useMediaGallery'

interface TabConfig {
    key: MediaFilter
    label: string
    icon: typeof Image
}

const TABS: TabConfig[] = [
    { key: 'all', label: 'All', icon: Image },
    { key: 'images', label: 'Photos', icon: Image },
    { key: 'videos', label: 'Videos', icon: Video },
    { key: 'documents', label: 'Files', icon: FileText },
]

interface MediaFilterTabsProps {
    activeFilter: MediaFilter
    onFilterChange: (filter: MediaFilter) => void
}

const MediaFilterTabsComponent = ({ activeFilter, onFilterChange }: MediaFilterTabsProps) => (
    <div className="flex gap-2 p-3 border-b border-gray-100 overflow-x-auto">
        {TABS.map(tab => (
            <button
                key={tab.key}
                onClick={() => onFilterChange(tab.key)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                    "transition-all whitespace-nowrap",
                    activeFilter === tab.key
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
            >
                <tab.icon className="w-4 h-4" />
                {tab.label}
            </button>
        ))}
    </div>
)

export const MediaFilterTabs = memo(MediaFilterTabsComponent)
MediaFilterTabs.displayName = 'MediaFilterTabs'
