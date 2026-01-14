/**
 * MediaGalleryModal Component
 * 
 * Displays all shared media in a conversation in a grid layout.
 * @module components/chat/gallery/MediaGalleryModal
 */

import { useState, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image, Loader2 } from 'lucide-react'
import { MediaThumbnail, type MediaItem } from './MediaThumbnail'
import { MediaFilterTabs } from './MediaFilterTabs'
import { useMediaGallery } from './useMediaGallery'
import { ImageLightbox } from '../message/ImageLightbox'

interface MediaGalleryModalProps {
    isOpen: boolean
    onClose: () => void
    conversationId: string
    currentUserId?: string
    conversationName: string
    isGroup?: boolean
    chatDeletedAt?: string | null
}

const MediaGalleryModalComponent = ({
    isOpen,
    onClose,
    conversationId,
    currentUserId,
    conversationName,
    isGroup = false,
    chatDeletedAt,
}: MediaGalleryModalProps) => {
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    const { filteredMedia, loading, error, filter, setFilter, fetchMedia } = useMediaGallery({
        conversationId,
        currentUserId,
        isGroup,
        chatDeletedAt,
        isOpen,
    })

    const handleItemClick = useCallback((item: MediaItem) => {
        if (item.media_type === 'image') {
            setLightboxUrl(item.media_url)
        } else if (item.media_type === 'video' || item.media_type === 'audio') {
            window.open(item.media_url, '_blank')
        } else {
            const link = document.createElement('a')
            link.href = item.media_url
            link.download = ''
            link.target = '_blank'
            link.click()
        }
    }, [])

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={onClose}
                        />

                        <motion.div
                            className="fixed inset-4 sm:inset-8 md:inset-16 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <div>
                                    <h2 className="font-semibold text-lg text-gray-900">Shared Media</h2>
                                    <p className="text-sm text-gray-500">{conversationName}</p>
                                </div>
                                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all" aria-label="Close">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <MediaFilterTabs activeFilter={filter} onFilterChange={setFilter} />

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <p className="text-red-500 mb-2">{error}</p>
                                        <button onClick={fetchMedia} className="text-purple-600 text-sm font-medium hover:underline">Try again</button>
                                    </div>
                                ) : filteredMedia.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Image className="w-16 h-16 mb-3" />
                                        <p className="text-lg font-medium">No media yet</p>
                                        <p className="text-sm">{filter === 'all' ? 'Shared photos and videos will appear here' : `No ${filter} shared yet`}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                        {filteredMedia.map(item => (
                                            <MediaThumbnail key={item.id} item={item} onClick={() => handleItemClick(item)} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {!loading && filteredMedia.length > 0 && (
                                <div className="p-3 border-t border-gray-100 text-center text-sm text-gray-500">
                                    {filteredMedia.length} {filteredMedia.length === 1 ? 'item' : 'items'}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
        </>
    )
}

export const MediaGalleryModal = memo(MediaGalleryModalComponent)
MediaGalleryModal.displayName = 'MediaGalleryModal'
