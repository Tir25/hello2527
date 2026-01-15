/**
 * Story Viewer
 * Full-screen story viewing experience
 * 
 * @module components/stories/StoryViewer
 */

import { memo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Eye } from 'lucide-react'
import { useStoryViewer, useStoryMedia, useStoryProgress, useStoryNavigation, useStoryPreload } from '@/hooks/stories'
import { deleteStory, deleteStoryFiles, addReaction, fetchStoryViewers } from '@/services/stories'
import { useAuthStore } from '@/store/authStore'
import { useStoryStore } from '@/store/storyStore'
import { chatService } from '@/lib/services/chat.service'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { StoryProgressBar } from './StoryProgressBar'
import { StoryHeader } from './StoryHeader'
import { QuickReactions, StoryOverlays, ViewersList } from './viewer'
import type { StoryViewerInfo } from '@/types'
import type { StoryReplyPayload } from '@/types/database.types'

/**
 * Full-screen story viewer component
 */
export const StoryViewer = memo(function StoryViewer() {
    const navigate = useNavigate()
    const {
        isOpen, isPaused, isMuted,
        currentGroup, currentStory, currentStoryIndex, currentGroupIndex, duration, close
    } = useStoryViewer()

    const { user } = useAuthStore()
    const isOwnStory = currentGroup?.userId === user?.id

    // Poll loading state - declared before hooks that need it
    const [pollLoading, setPollLoading] = useState(false)

    // Custom hooks for modularity
    const { mediaReady, videoRef, handleMediaLoaded } = useStoryMedia({
        isOpen, isPaused, currentStory
    })

    const { progress } = useStoryProgress({
        isOpen, isPaused, duration,
        currentStory, currentGroup, currentStoryIndex,
        mediaReady, pollLoading
    })

    const { handleTap } = useStoryNavigation()

    // Preload adjacent stories
    const groups = useStoryStore((s) => s.groups)
    useStoryPreload({
        isOpen,
        currentGroup,
        currentStoryIndex,
        groups,
        currentGroupIndex
    })

    // Local state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showViewersList, setShowViewersList] = useState(false)
    const [viewers, setViewers] = useState<StoryViewerInfo[]>([])
    const [replyMessage, setReplyMessage] = useState('')

    // Callback to pause story timer while poll is loading
    const handlePollLoadingChange = useCallback((isLoading: boolean) => {
        setPollLoading(isLoading)
    }, [])

    // Sticker click handlers
    const handleLocationClick = useCallback((location: string) => {
        close()
        // Navigate to search with location query
        navigate(`/search?q=${encodeURIComponent(location)}&type=places`)
    }, [close, navigate])

    const handleMentionClick = useCallback((username: string) => {
        close()
        // Navigate to user profile
        navigate(`/${username}`)
    }, [close, navigate])

    // Auto-fetch viewers for own stories
    useEffect(() => {
        if (isOpen && isOwnStory && currentStory) {
            fetchStoryViewers(currentStory.id).then(setViewers).catch(console.error)
        }
        if (!isOpen) setViewers([])
    }, [isOpen, isOwnStory, currentStory?.id])

    // Delete handler
    const handleDelete = useCallback(async () => {
        if (!currentStory || isDeleting) return
        const storyToDelete = currentStory
        const isLastStory = currentGroup && currentGroup.stories.length <= 1

        setIsDeleting(true)
        try {
            await deleteStory(storyToDelete.id)
            deleteStoryFiles({ media_url: storyToDelete.media_url }).catch(console.error)
            setShowDeleteConfirm(false)
            useStoryStore.getState().removeStory(storyToDelete.id)
            if (isLastStory) close()
        } catch (err) {
            console.error('Failed to delete:', err)
        } finally {
            setIsDeleting(false)
        }
    }, [currentStory, currentGroup, isDeleting, close])

    // Reply handler
    const handleReply = useCallback(async () => {
        if (!replyMessage.trim() || !user || !currentGroup || !currentStory) return
        const msg = replyMessage.trim()
        setReplyMessage('')

        // Build structured payload
        const payload: StoryReplyPayload = {
            type: 'story_reply',
            storyId: currentStory.id,
            storyOwnerId: currentGroup.userId,
            thumbnailUrl: currentStory.thumbnail_url || null,
            mediaUrl: currentStory.media_url,
            expiresAt: currentStory.expires_at,
            replyText: msg
        }

        const { success } = await chatService.sendMessage(
            `Replied to your story: "${msg}"`,  // Fallback text
            user.id,
            currentGroup.userId,
            currentStory.thumbnail_url ?? undefined,
            currentStory.thumbnail_url ? 'image' : undefined,
            undefined,
            payload
        )
        if (!success) setReplyMessage(msg)
    }, [replyMessage, user, currentGroup, currentStory])

    if (!isOpen || !currentGroup || !currentStory) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
                <div className="relative w-full h-full max-w-md bg-zinc-900 overflow-hidden shadow-2xl md:rounded-xl md:h-[90vh]">
                    {/* Media */}
                    {/* Loading skeleton */}
                    {!mediaReady && (
                        <div className="absolute inset-0 z-5 flex items-center justify-center bg-zinc-900">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {currentStory.media_type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={currentStory.media_url}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ filter: currentStory.filter && currentStory.filter !== 'none' ? currentStory.filter : undefined }}
                            muted={isMuted} playsInline
                            onLoadedData={handleMediaLoaded}
                        />
                    ) : (
                        <img
                            src={currentStory.media_url}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ filter: currentStory.filter && currentStory.filter !== 'none' ? currentStory.filter : undefined }}
                            alt="Story"
                            loading="eager"
                            onLoad={handleMediaLoaded}
                        />
                    )}

                    {/* Overlays */}
                    <StoryOverlays
                        storyId={currentStory.id}
                        textOverlays={currentStory.text_overlays}
                        stickers={currentStory.stickers}
                        isOwnStory={isOwnStory}
                        onPollLoadingChange={handlePollLoadingChange}
                        onLocationClick={handleLocationClick}
                        onMentionClick={handleMentionClick}
                    />

                    {/* Progress */}
                    <StoryProgressBar totalStories={currentGroup.stories.length} currentIndex={currentStoryIndex} progress={progress} />

                    {/* Header */}
                    <StoryHeader
                        username={currentGroup.user.username}
                        avatarUrl={currentGroup.user.avatar_url}
                        timestamp={currentStory.posted_at}
                        isOwnStory={isOwnStory}
                        onClose={close}
                        onMoreClick={() => setShowDeleteConfirm(true)}
                    />

                    {/* Tap zones: 25% prev | 50% pause/play | 25% next */}
                    <div
                        className="absolute inset-0 z-10 flex touch-manipulation cursor-pointer"
                        onClick={handleTap}
                        role="button"
                        tabIndex={0}
                        aria-label="Story navigation - tap left for previous, center for pause/play, right for next"
                    >
                        <div className="w-1/4 h-full" aria-hidden="true" />
                        <div className="w-1/2 h-full" aria-hidden="true" />
                        <div className="w-1/4 h-full" aria-hidden="true" />
                    </div>

                    {/* Pause indicator */}
                    {isPaused && mediaReady && (
                        <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full p-4">
                                <div className="w-8 h-8 flex items-center justify-center gap-1">
                                    <div className="w-2 h-6 bg-white rounded-sm" />
                                    <div className="w-2 h-6 bg-white rounded-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reply UI (not own story) */}
                    {!isOwnStory && (
                        <div
                            className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-4"
                            style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="text" value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Send a message..."
                                    className="flex-1 bg-white/10 border border-white/20 rounded-full py-3 px-5 text-white text-sm placeholder:text-white/60 focus:outline-none focus:bg-black/40 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                />
                                <button
                                    onClick={() => currentStory && addReaction(currentStory.id, '❤️')}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                                    aria-label="Like"
                                >
                                    <Heart className="text-white w-7 h-7" />
                                </button>
                                <button
                                    onClick={handleReply}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                                    aria-label="Send"
                                >
                                    <Send className="text-white w-6 h-6 -rotate-12" />
                                </button>
                            </div>
                            <QuickReactions onReact={(emoji) => currentStory && addReaction(currentStory.id, emoji)} />
                        </div>
                    )}

                    {/* Viewers (own story) */}
                    {isOwnStory && (
                        <div
                            className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex justify-center"
                            style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}
                        >
                            <button
                                onClick={async () => {
                                    if (currentStory) {
                                        const data = await fetchStoryViewers(currentStory.id)
                                        setViewers(data)
                                        setShowViewersList(true)
                                    }
                                }}
                                className="flex items-center gap-2 bg-white/10 px-5 py-3 rounded-full text-white text-sm hover:bg-white/20 transition-colors min-h-[44px] touch-manipulation"
                            >
                                <Eye size={18} />
                                <span>{viewers.length > 0 ? viewers.length : (currentStory?.view_count || 0)} views</span>
                            </button>
                        </div>
                    )}

                    {/* Modals */}
                    <ViewersList isOpen={showViewersList} onClose={() => setShowViewersList(false)} viewers={viewers} />
                    <DeleteConfirmModal
                        isOpen={showDeleteConfirm}
                        isDeleting={isDeleting}
                        onCancel={() => setShowDeleteConfirm(false)}
                        onConfirm={handleDelete}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    )
})
