import { motion } from 'framer-motion'

/**
 * Loading State Component
 * 
 * Displays animated skeleton placeholders while conversations are loading.
 * Uses staggered animations for a smooth, polished loading experience.
 */

const SkeletonItem = ({ index }: { index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.3 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/20 min-h-[72px]"
    >
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
                {/* Name skeleton - varying widths for natural look */}
                <div
                    className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-pulse"
                    style={{ width: `${55 + (index % 3) * 15}%` }}
                />
                {/* Time skeleton */}
                <div className="h-3 w-10 bg-gray-200/70 rounded animate-pulse flex-shrink-0" />
            </div>
            {/* Message preview skeleton */}
            <div
                className="h-3.5 bg-gray-200/60 rounded-md animate-pulse"
                style={{ width: `${65 + (index % 2) * 25}%` }}
            />
        </div>
    </motion.div>
)

export const LoadingState = () => {
    return (
        <div className="space-y-2" aria-label="Loading conversations" role="status">
            {[0, 1, 2, 3, 4].map((index) => (
                <SkeletonItem key={index} index={index} />
            ))}
            <span className="sr-only">Loading conversations...</span>
        </div>
    )
}
