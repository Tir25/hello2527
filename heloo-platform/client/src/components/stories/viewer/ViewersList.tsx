/**
 * Viewers List Component
 * Bottom sheet showing story viewers
 * 
 * @module components/stories/viewer/ViewersList
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye } from 'lucide-react'
import type { StoryViewerInfo } from '@/types'

interface ViewersListProps {
    isOpen: boolean
    viewers: StoryViewerInfo[]
    onClose: () => void
}

/**
 * Format relative time
 */
function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    return `${Math.floor(diffHours / 24)}d`
}

/**
 * Bottom sheet with viewer list
 */
export const ViewersList = memo(function ViewersList({
    isOpen,
    viewers,
    onClose
}: ViewersListProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="absolute inset-x-0 bottom-0 top-1/3 bg-zinc-900 rounded-t-3xl z-50 flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Eye size={18} />
                            Viewers ({viewers.length})
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 -m-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <X className="text-zinc-500" />
                        </button>
                    </div>

                    {/* Viewer List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {viewers.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">
                                No viewers yet
                            </p>
                        ) : (
                            viewers.map(viewer => (
                                <div
                                    key={viewer.user_id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={viewer.avatar_url || '/default-avatar.svg'}
                                            className="w-10 h-10 rounded-full bg-zinc-800"
                                            alt=""
                                        />
                                        <div>
                                            <div className="text-white font-bold text-sm">
                                                {viewer.username}
                                            </div>
                                            <div className="text-zinc-500 text-xs">
                                                {formatTime(viewer.viewed_at)} ago
                                            </div>
                                        </div>
                                    </div>
                                    {viewer.has_reacted && viewer.reaction_emoji && (
                                        <span className="text-lg">{viewer.reaction_emoji}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
