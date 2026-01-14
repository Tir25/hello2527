import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Conversation Skeleton Component
 * 
 * Displays animated skeleton placeholders while conversations are loading.
 * Improves perceived performance by showing content structure immediately.
 */

interface ConversationSkeletonProps {
    count?: number
}

const SkeletonItem = ({ index }: { index: number }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/30 border border-white/20"
    >
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
                {/* Name skeleton */}
                <div
                    className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"
                    style={{ width: `${60 + (index % 3) * 15}%` }}
                />
                {/* Time skeleton */}
                <div className="h-3 w-8 bg-gray-200 rounded animate-pulse flex-shrink-0" />
            </div>
            {/* Message preview skeleton */}
            <div
                className="h-3 bg-gray-200/80 rounded animate-pulse"
                style={{ width: `${70 + (index % 2) * 20}%` }}
            />
        </div>
    </motion.div>
)

export const ConversationSkeleton = memo(({ count = 5 }: ConversationSkeletonProps) => {
    return (
        <div className="space-y-2" aria-label="Loading conversations" role="status">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonItem key={index} index={index} />
            ))}
            <span className="sr-only">Loading conversations...</span>
        </div>
    )
})

ConversationSkeleton.displayName = 'ConversationSkeleton'

export default ConversationSkeleton
