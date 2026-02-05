/**
 * Responses Drawer Component
 * Bottom sheet showing all question sticker responses for story owner
 *
 * @module components/stories/viewer/ResponsesDrawer
 */

import { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Reply, Loader2 } from 'lucide-react'
import { getResponses, type QuestionResponse } from '@/services/stories/questionService'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/store/chatStore'
import { useStoryStore } from '@/store/storyStore'
import type { Profile } from '@/lib/services/profile.service'

interface ResponsesDrawerProps {
    isOpen: boolean
    onClose: () => void
    storyId: string
    stickerId: string
    question: string
}

/**
 * Bottom drawer showing all responses with reply option
 */
export const ResponsesDrawer = memo(function ResponsesDrawer({
    isOpen,
    onClose,
    storyId,
    stickerId,
    question
}: ResponsesDrawerProps) {
    const [responses, setResponses] = useState<QuestionResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()
    const setSelectedUser = useChatStore(state => state.setSelectedUser)
    const closeViewer = useStoryStore(state => state.closeViewer)

    // Load responses when opened
    useEffect(() => {
        if (!isOpen) return

        let mounted = true
        setIsLoading(true)

        getResponses(storyId, stickerId)
            .then(data => {
                if (mounted) setResponses(data)
            })
            .catch(err => console.error('Failed to load responses:', err))
            .finally(() => {
                if (mounted) setIsLoading(false)
            })

        return () => { mounted = false }
    }, [isOpen, storyId, stickerId])

    const handleReply = useCallback((response: QuestionResponse) => {
        // Close the drawer and story viewer
        onClose()
        closeViewer()

        // Set the selected user in chat store to open the conversation
        // Uses type assertion following existing sidebar pattern (useSidebar.ts line 151)
        setSelectedUser({
            id: response.user_id,
            username: response.user?.username || 'Unknown',
            avatar_url: response.user?.avatar_url || null,
            full_name: response.user?.username || null,
        } as Profile)

        // Navigate to the main chat page (which shows the selected conversation)
        navigate('/')
    }, [navigate, onClose, closeViewer, setSelectedUser])

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`
        return date.toLocaleDateString()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 max-h-[70vh] flex flex-col"
                    >
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-800">
                            <h2 className="text-white font-bold text-lg">Responses</h2>
                            <button
                                onClick={onClose}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Question */}
                        <div className="px-4 py-3 bg-purple-500/10 border-b border-zinc-800">
                            <p className="text-purple-400 text-sm font-medium">{question}</p>
                        </div>

                        {/* Responses List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                                </div>
                            ) : responses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                    <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                                    <p>No responses yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-800">
                                    {responses.map(response => (
                                        <ResponseItem
                                            key={response.id}
                                            response={response}
                                            onReply={handleReply}
                                            formatTime={formatTime}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
})

interface ResponseItemProps {
    response: QuestionResponse
    onReply: (response: QuestionResponse) => void
    formatTime: (date: string) => string
}

const ResponseItem = memo(function ResponseItem({
    response,
    onReply,
    formatTime
}: ResponseItemProps) {
    return (
        <div className="flex items-start gap-3 p-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                {response.user?.avatar_url ? (
                    <img
                        src={response.user.avatar_url}
                        alt={response.user.username}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-bold">
                        {response.user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                        {response.user?.username || 'Unknown'}
                    </span>
                    <span className="text-zinc-500 text-xs">
                        {formatTime(response.created_at)}
                    </span>
                </div>
                <p className="text-zinc-300 text-sm mt-1 break-words">
                    {response.content}
                </p>
            </div>

            {/* Reply Button */}
            <button
                onClick={() => onReply(response)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-purple-500 touch-manipulation"
                title="Reply via DM"
            >
                <Reply className="w-5 h-5" />
            </button>
        </div>
    )
})
