/**
 * Question Display Component
 * Shows Q&A sticker with response input for viewers and response list for owners
 *
 * @module components/stories/viewer/QuestionDisplay
 */

import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Send, MessageCircle, Loader2, Check } from 'lucide-react'
import { submitResponse, getResponseCount } from '@/services/stories/questionService'
import { ResponsesDrawer } from './ResponsesDrawer'

interface QuestionDisplayProps {
    storyId: string
    stickerId: string
    data: string
    x: number
    y: number
    isOwnStory?: boolean
    /** Callback when user is interacting (typing) - use to pause story */
    onInteractionChange?: (isInteracting: boolean) => void
}

/**
 * Interactive Q&A display for story viewer
 * - Viewers can submit multiple responses
 * - Owners can tap to view all responses
 */
export const QuestionDisplay = memo(function QuestionDisplay({
    storyId,
    stickerId,
    data,
    x,
    y,
    isOwnStory = false,
    onInteractionChange
}: QuestionDisplayProps) {
    const [response, setResponse] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [responseCount, setResponseCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Track interaction state: paused when focused, submitting, or showing success
    const isInteracting = isFocused || isSubmitting || showSuccess

    // Notify parent of interaction changes
    useEffect(() => {
        onInteractionChange?.(isInteracting)
    }, [isInteracting, onInteractionChange])

    // Parse question from data
    const question = data || 'Ask me anything'

    // Load response count
    useEffect(() => {
        let mounted = true

        getResponseCount(storyId, stickerId)
            .then(count => {
                if (mounted) {
                    setResponseCount(count)
                    setIsLoading(false)
                }
            })
            .catch(error => {
                console.error('Failed to load response count:', error)
                if (mounted) setIsLoading(false)
            })

        return () => { mounted = false }
    }, [storyId, stickerId])

    const handleSubmit = useCallback(async () => {
        if (!response.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            await submitResponse(storyId, stickerId, response.trim())
            setResponseCount(prev => prev + 1)
            setResponse('')
            setIsFocused(false)
            inputRef.current?.blur()
            // Show success briefly then allow another response
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
        } catch (error) {
            console.error('Failed to submit response:', error)
        } finally {
            setIsSubmitting(false)
        }
    }, [storyId, stickerId, response, isSubmitting])

    const handleOwnerTap = useCallback(() => {
        setIsDrawerOpen(true)
    }, [])

    return (
        <>
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                style={{ transform: `translate(${x}px, ${y}px)` }}
                data-story-interactive="true"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-purple-500/90 to-violet-600/90 backdrop-blur-md 
                        rounded-2xl p-4 shadow-2xl min-w-[240px] max-w-[300px]"
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <HelpCircle className="w-5 h-5 text-white" />
                        <h3 className="text-white font-bold text-sm flex-1 truncate">
                            {question}
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                    ) : isOwnStory ? (
                        /* Owner view - tap to see responses */
                        <button
                            onClick={handleOwnerTap}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl
                                hover:bg-white/20 transition-colors touch-manipulation"
                        >
                            <MessageCircle className="w-5 h-5 text-white" />
                            <span className="text-white font-medium">
                                {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                            </span>
                        </button>
                    ) : showSuccess ? (
                        /* Success feedback */
                        <div className="flex items-center justify-center gap-2 py-3 bg-green-500/30 rounded-xl">
                            <Check className="w-5 h-5 text-white" />
                            <span className="text-white font-medium">Response sent!</span>
                        </div>
                    ) : (
                        /* Viewer - show input (allows multiple responses) */
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={response}
                                onChange={e => setResponse(e.target.value)}
                                placeholder="Type your response..."
                                className="flex-1 bg-white/20 text-white px-3 py-2 rounded-xl
                                    placeholder:text-white/60 outline-none focus:bg-white/30 text-sm"
                                maxLength={500}
                                ref={inputRef}
                                // Stop ALL events from bubbling to prevent story navigation
                                onClick={e => e.stopPropagation()}
                                onPointerDown={e => e.stopPropagation()}
                                onPointerUp={e => e.stopPropagation()}
                                onTouchStart={e => e.stopPropagation()}
                                onTouchEnd={e => e.stopPropagation()}
                                onMouseDown={e => e.stopPropagation()}
                                onMouseUp={e => e.stopPropagation()}
                                onKeyDown={e => {
                                    // Stop propagation to prevent story keyboard navigation
                                    e.stopPropagation()
                                    if (e.key === 'Enter') handleSubmit()
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                            />
                            <button
                                onClick={e => {
                                    e.stopPropagation()
                                    handleSubmit()
                                }}
                                onPointerDown={e => {
                                    // Prevent focus shift/blur to avoid progress resuming
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                                onTouchStart={e => e.stopPropagation()}
                                disabled={!response.trim() || isSubmitting}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center
                                    bg-white text-purple-600 rounded-xl font-bold
                                    disabled:opacity-50 touch-manipulation"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Responses drawer for owner */}
            {isOwnStory && (
                <ResponsesDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    storyId={storyId}
                    stickerId={stickerId}
                    question={question}
                />
            )}
        </>
    )
})
