/**
 * Poll Display Component
 * Interactive poll voting UI for story viewer with optimistic updates
 *
 * @module components/stories/viewer/PollDisplay
 */

import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, Check, Loader2, Users, ChevronDown, ChevronUp } from 'lucide-react'
import {
    getPollResults,
    submitVote,
    calculateOptimisticResults,
    getDetailedPollResults,
    type PollResults,
    type DetailedPollResults,
    type PollVoter
} from '@/services/stories/pollService'

interface PollDisplayProps {
    storyId: string
    stickerId: string
    data: string // Format: "Question|Option1|Option2|..."
    x: number
    y: number
    /** Whether this is the current user's story */
    isOwnStory?: boolean
    /** Callback when loading state changes - use to pause story timer */
    onLoadingChange?: (isLoading: boolean) => void
}

/**
 * Parse poll data which can be either:
 * - String: "Question|Option1|Option2|..."
 * - Object: { question: "...", options: ["A", "B"] }
 */
function parsePollData(data: string | { question?: string; options?: string[] }): { question: string; options: string[] } {
    // Handle object format (from some stickers)
    if (typeof data === 'object' && data !== null) {
        return {
            question: data.question || 'Vote!',
            options: data.options || []
        }
    }
    // Handle string format: "Question|Option1|Option2|..."
    const parts = (data as string).split('|')
    return {
        question: parts[0] || 'Vote!',
        options: parts.slice(1).filter(Boolean)
    }
}

/**
 * Interactive poll display for story viewer
 * Features:
 * - Optimistic updates for instant feedback
 * - Debounced voting to prevent rapid clicks
 * - Graceful error handling
 * - Detailed results for story owners
 */
export const PollDisplay = memo(function PollDisplay({
    storyId,
    stickerId,
    data,
    x,
    y,
    isOwnStory = false,
    onLoadingChange
}: PollDisplayProps) {
    const { question, options } = parsePollData(data)
    const [results, setResults] = useState<PollResults | DetailedPollResults | null>(null)
    const [isVoting, setIsVoting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showVoters, setShowVoters] = useState(false)
    const votingRef = useRef(false) // Prevent rapid clicks

    // Notify parent when loading state changes (to pause story timer)
    useEffect(() => {
        onLoadingChange?.(isLoading)
    }, [isLoading, onLoadingChange])

    // Fetch initial results
    useEffect(() => {
        if (options.length === 0) {
            setIsLoading(false)
            return
        }

        let mounted = true
        setIsLoading(true)

        // Story owner gets detailed results with voter info
        const fetchResults = isOwnStory
            ? getDetailedPollResults(storyId, stickerId, options.length)
            : getPollResults(storyId, stickerId, options.length)

        fetchResults
            .then(data => {
                if (mounted) {
                    setResults(data)
                    setError(null)
                }
            })
            .catch(err => {
                if (mounted) {
                    console.error('Failed to fetch poll results:', err)
                    setError('Failed to load poll')
                }
            })
            .finally(() => {
                if (mounted) setIsLoading(false)
            })

        return () => { mounted = false }
    }, [storyId, stickerId, options.length, isOwnStory])

    const handleVote = useCallback(async (optionIndex: number) => {
        // Prevent voting if already voted, loading, own story, or rapid clicking
        const hasAlreadyVoted = results !== null && typeof results.userVote === 'number'
        if (hasAlreadyVoted || isVoting || votingRef.current || isLoading || isOwnStory) return

        votingRef.current = true
        setIsVoting(true)
        setError(null)

        // Optimistic update - show result immediately
        const optimisticResults = calculateOptimisticResults(results, optionIndex, options.length)
        setResults(optimisticResults)

        try {
            const { success, alreadyVoted } = await submitVote(storyId, stickerId, optionIndex)

            if (!success && alreadyVoted) {
                // User already voted - just refresh to get actual results
                const actualResults = await getPollResults(storyId, stickerId, options.length)
                setResults(actualResults)
                return
            }

            // Vote successful - fetch actual results to ensure consistency
            const actualResults = await getPollResults(storyId, stickerId, options.length)
            setResults(actualResults)
        } catch (err) {
            // Rollback optimistic update on error
            console.error('Vote failed:', err)
            setError('Failed to vote. Please try again.')

            // Refetch actual state
            try {
                const actualResults = await getPollResults(storyId, stickerId, options.length)
                setResults(actualResults)
            } catch {
                // Keep optimistic state if refetch also fails
            }
        } finally {
            setIsVoting(false)
            // Add small delay before allowing another vote attempt
            setTimeout(() => { votingRef.current = false }, 500)
        }
    }, [storyId, stickerId, options.length, isVoting, results, isLoading, isOwnStory])

    const hasVoted = results !== null && typeof results.userVote === 'number'
    const detailedResults = results as DetailedPollResults | null
    const hasVoters = isOwnStory && detailedResults?.voters && detailedResults.voters.length > 0

    if (options.length < 2) return null

    return (
        <div
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-green-500/90 to-emerald-600/90 backdrop-blur-md 
                    rounded-2xl p-4 shadow-2xl min-w-[200px] max-w-[280px]"
            >
                {/* Question */}
                <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-5 h-5 text-white" />
                    <h3 className="text-white font-bold text-sm">{question}</h3>
                </div>

                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}

                {/* Options */}
                {!isLoading && (
                    <div className="space-y-2">
                        {options.map((option, index) => {
                            const percentage = results?.percentages[index] ?? 0
                            const isSelected = results?.userVote === index
                            const showResults = hasVoted || isVoting || isOwnStory
                            const optionVoters = hasVoters
                                ? detailedResults.voters.filter(v => v.option_index === index)
                                : []

                            return (
                                <div key={index}>
                                    <button
                                        onClick={() => handleVote(index)}
                                        disabled={hasVoted || isVoting || isOwnStory}
                                        className={`w-full relative overflow-hidden rounded-lg min-h-[48px] py-3 px-4 text-left
                                            transition-all duration-200 touch-manipulation select-none
                                            ${isOwnStory ? 'cursor-default' : showResults ? 'cursor-default' : 'hover:scale-[1.02] active:scale-[0.98]'}
                                            ${isSelected ? 'bg-white text-green-700' : 'bg-white/20 text-white hover:bg-white/30'}
                                        `}
                                    >
                                        {/* Progress bar with animation */}
                                        <AnimatePresence>
                                            {showResults && (
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    exit={{ width: 0 }}
                                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                                    className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-green-200' : 'bg-white/20'}`}
                                                />
                                            )}
                                        </AnimatePresence>

                                        {/* Content */}
                                        <div className="relative flex items-center justify-between gap-2">
                                            <span className="font-medium text-sm truncate flex items-center gap-2">
                                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                                {option}
                                            </span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {showResults && (
                                                    <motion.span
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-xs font-bold"
                                                    >
                                                        {percentage}%
                                                    </motion.span>
                                                )}
                                                {/* Show voter count for story owner */}
                                                {isOwnStory && optionVoters.length > 0 && (
                                                    <span className="text-xs opacity-70">
                                                        ({optionVoters.length})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Vote count and toggle voters button for story owner */}
                {!isLoading && results && results.total > 0 && (
                    <div className="mt-2">
                        {isOwnStory && hasVoters ? (
                            <button
                                onClick={() => setShowVoters(!showVoters)}
                                className="w-full flex items-center justify-center gap-1 text-white/80 text-xs py-1 
                                    hover:text-white transition-colors"
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>{results.total} vote{results.total !== 1 ? 's' : ''}</span>
                                {showVoters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        ) : (
                            <p className="text-white/70 text-xs text-center">
                                {results.total} vote{results.total !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                )}

                {/* Voters list for story owner */}
                <AnimatePresence>
                    {showVoters && hasVoters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 pt-2 border-t border-white/20 max-h-32 overflow-y-auto">
                                {options.map((option, optIndex) => {
                                    const optionVoters = detailedResults?.voters.filter(v => v.option_index === optIndex) || []
                                    if (optionVoters.length === 0) return null

                                    return (
                                        <div key={optIndex} className="mb-2">
                                            <p className="text-xs text-white/60 mb-1 font-medium">{option}:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {optionVoters.map((voter) => (
                                                    <VoterChip key={voter.user_id} voter={voter} />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-200 text-xs mt-2 text-center"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
})

/** Small voter chip showing username */
const VoterChip = memo(function VoterChip({ voter }: { voter: PollVoter }) {
    return (
        <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
            {voter.avatar_url ? (
                <img
                    src={voter.avatar_url}
                    alt={voter.username}
                    className="w-3 h-3 rounded-full object-cover"
                />
            ) : (
                <div className="w-3 h-3 rounded-full bg-white/30" />
            )}
            <span className="text-[10px] text-white font-medium truncate max-w-[60px]">
                {voter.username}
            </span>
        </div>
    )
})
