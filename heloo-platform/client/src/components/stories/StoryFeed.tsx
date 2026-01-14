/**
 * Story Feed
 * Horizontal scrollable feed of story bubbles
 * 
 * @module components/stories/StoryFeed
 */

import { memo, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Camera } from 'lucide-react'
import { useStories, useStoryViewer } from '@/hooks/stories'
import { useAuthStore } from '@/store/authStore'
import { useStoryStore } from '@/store/storyStore'
import { StoryBubble } from './StoryBubble'
import { StoryCreator } from './StoryCreator'

/**
 * Story Feed - Shows user's own story bubble + other users' stories
 */
export const StoryFeed = memo(function StoryFeed() {
    const { groups, isLoading, error, refetch } = useStories()
    const { open } = useStoryViewer()
    const { user, profile } = useAuthStore()
    const setCreatorOpen = useStoryStore((s) => s.setCreatorOpen)
    const [isCreatorOpen, setIsCreatorOpenLocal] = useState(false)

    // Sync creator state with global store for NavigationOrb hiding
    const setIsCreatorOpen = useCallback((open: boolean) => {
        setIsCreatorOpenLocal(open)
        setCreatorOpen(open)
    }, [setCreatorOpen])

    // Find user's own story group
    const ownStoryGroup = useMemo(() => {
        return groups.find(g => g.userId === user?.id)
    }, [groups, user?.id])

    // Get index of own story group
    const ownStoryGroupIndex = useMemo(() => {
        return groups.findIndex(g => g.userId === user?.id)
    }, [groups, user?.id])

    // Other users' stories (exclude own)
    const otherGroups = useMemo(() => {
        return groups.filter(g => g.userId !== user?.id)
    }, [groups, user?.id])

    const handleOwnStoryClick = useCallback(() => {
        if (ownStoryGroup && ownStoryGroup.stories.length > 0) {
            open(ownStoryGroupIndex)
        } else {
            setIsCreatorOpen(true)
        }
    }, [ownStoryGroup, ownStoryGroupIndex, open])

    const handleAddStory = useCallback(() => {
        setIsCreatorOpen(true)
    }, [setIsCreatorOpen])

    const handleStoryClick = useCallback((groupIndex: number) => {
        const adjustedIndex = ownStoryGroup ? groupIndex + 1 : groupIndex
        open(adjustedIndex)
    }, [open, ownStoryGroup])

    if (error) {
        return (
            <div className="p-4 text-center text-red-500 text-sm">
                Failed to load stories
            </div>
        )
    }

    return (
        <>
            <div className="pt-4 pb-6 px-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar snap-x snap-mandatory touch-pan-x">
                <div className="flex gap-5 min-w-min">

                    {/* Own Story Section */}
                    {ownStoryGroup && ownStoryGroup.stories.length > 0 ? (
                        // Has stories - show as bubble with add button
                        <div className="relative">
                            <StoryBubble
                                username="Your story"
                                avatarUrl={profile?.avatar_url || null}
                                hasUnviewed={ownStoryGroup.hasUnviewed}
                                isMine
                                onClick={handleOwnStoryClick}
                            />
                            {/* Add more button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddStory()
                                }}
                                className="absolute bottom-6 right-1 bg-blue-500 rounded-full p-1.5 border-[3px] border-white dark:border-slate-900 shadow-sm z-30"
                            >
                                <Camera className="w-3 h-3 text-white" />
                            </motion.button>
                        </div>
                    ) : (
                        // No stories - show upload button
                        <div
                            className="flex flex-col items-center gap-2 cursor-pointer group w-20 flex-shrink-0"
                            onClick={handleAddStory}
                        >
                            <div className="relative w-[76px] h-[76px] flex items-center justify-center">
                                <div className="w-[68px] h-[68px] rounded-full border border-slate-200 dark:border-slate-700 p-[2px]">
                                    <img
                                        src={profile?.avatar_url || '/default-avatar.svg'}
                                        className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        alt="You"
                                    />
                                </div>
                                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-[3px] border-white dark:border-slate-900 shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your story</span>
                        </div>
                    )}

                    {/* Loading placeholders */}
                    {isLoading && groups.length === 0 && (
                        <>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                                    <div className="w-[76px] h-[76px] rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                    <div className="w-12 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                </div>
                            ))}
                        </>
                    )}

                    {/* Other users' stories */}
                    {otherGroups.map((group, index) => (
                        <StoryBubble
                            key={group.userId}
                            username={group.user.username}
                            avatarUrl={group.user.avatar_url}
                            hasUnviewed={group.hasUnviewed}
                            isCloseFriends={group.stories.some(s => s.audience_type === 'close_friends')}
                            onClick={() => handleStoryClick(index)}
                        />
                    ))}

                    {/* Empty state */}
                    {!isLoading && otherGroups.length === 0 && (
                        <div className="flex items-center justify-center px-4 py-2 text-sm text-slate-500 dark:text-slate-400 italic">
                            No stories yet - Stories from friends will appear here
                        </div>
                    )}
                </div>
            </div>

            {/* StoryViewer is rendered globally in DashboardLayout */}

            {/* Story Creator Modal */}
            <StoryCreator
                isOpen={isCreatorOpen}
                onClose={() => setIsCreatorOpen(false)}
                onSuccess={refetch}
            />

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
            `}</style>
        </>
    )
})
