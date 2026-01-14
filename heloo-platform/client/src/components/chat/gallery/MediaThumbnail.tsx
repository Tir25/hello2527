/**
 * MediaThumbnail Component
 * 
 * Displays a single media item thumbnail in the gallery grid.
 * Supports images, videos, and documents with appropriate icons.
 * 
 * @module components/chat/gallery/MediaThumbnail
 */

import { memo } from 'react'
import { Play, FileText, Music } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface MediaItem {
    id: string
    media_url: string
    media_type: 'image' | 'video' | 'audio' | 'document'
    created_at: string
    sender_id: string
}

interface MediaThumbnailProps {
    /** The media item to display */
    item: MediaItem
    /** Click handler for opening lightbox */
    onClick: () => void
    /** Additional CSS classes */
    className?: string
}

const MediaThumbnailComponent = ({
    item,
    onClick,
    className,
}: MediaThumbnailProps) => {
    const renderContent = () => {
        switch (item.media_type) {
            case 'image':
                return (
                    <img
                        src={item.media_url}
                        alt="Shared image"
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                )

            case 'video':
                return (
                    <>
                        <video
                            src={item.media_url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" />
                            </div>
                        </div>
                    </>
                )

            case 'audio':
                return (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                        <Music className="w-8 h-8 text-purple-600" />
                    </div>
                )

            case 'document':
            default:
                return (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                )
        }
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative aspect-square rounded-xl overflow-hidden",
                "hover:opacity-90 active:scale-95 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                className
            )}
            aria-label={`View ${item.media_type}`}
        >
            {renderContent()}
        </button>
    )
}

export const MediaThumbnail = memo(MediaThumbnailComponent)
MediaThumbnail.displayName = 'MediaThumbnail'
