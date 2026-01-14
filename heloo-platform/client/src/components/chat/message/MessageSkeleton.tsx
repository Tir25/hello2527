/**
 * MessageSkeleton Component
 * 
 * Skeleton placeholder for loading messages.
 * Displays a shimmer animation while messages are being fetched.
 * 
 * Responsibility: Loading state UI for messages
 * Layer: UI Component (Presenter)
 */

import { memo } from 'react'
import { cn } from '@/utils/cn'

interface MessageSkeletonProps {
    /** Whether to show as own message (right-aligned) */
    isOwn?: boolean
    /** Whether to show with media placeholder */
    hasMedia?: boolean
}

const MessageSkeletonComponent = ({ isOwn = false, hasMedia = false }: MessageSkeletonProps) => {
    return (
        <div className={cn(
            "flex mb-3 px-3",
            isOwn ? "justify-end" : "justify-start"
        )}>
            {/* Avatar placeholder for received messages */}
            {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-2 flex-shrink-0" />
            )}

            <div className={cn(
                "rounded-2xl overflow-hidden",
                isOwn
                    ? "bg-gradient-to-r from-violet-200 to-blue-200 rounded-tr-md"
                    : "bg-gray-100 rounded-tl-md",
                hasMedia ? "w-48 sm:w-56" : "max-w-[70%]"
            )}>
                {/* Media placeholder */}
                {hasMedia && (
                    <div className="w-full h-32 bg-gray-200 animate-pulse" />
                )}

                {/* Text lines */}
                <div className="px-4 py-3 space-y-2">
                    <div className={cn(
                        "h-3 rounded-full animate-pulse",
                        isOwn ? "bg-white/40" : "bg-gray-200",
                        "w-full"
                    )} />
                    <div className={cn(
                        "h-3 rounded-full animate-pulse",
                        isOwn ? "bg-white/40" : "bg-gray-200",
                        "w-3/4"
                    )} />
                </div>

                {/* Timestamp placeholder */}
                <div className="px-4 pb-2 flex justify-end">
                    <div className={cn(
                        "h-2 w-12 rounded-full animate-pulse",
                        isOwn ? "bg-white/30" : "bg-gray-200"
                    )} />
                </div>
            </div>
        </div>
    )
}

export const MessageSkeleton = memo(MessageSkeletonComponent)
MessageSkeleton.displayName = 'MessageSkeleton'

/**
 * MessageListSkeleton Component
 * 
 * Displays a list of skeleton messages for loading state.
 */
interface MessageListSkeletonProps {
    /** Number of skeleton messages to show */
    count?: number
}

const MessageListSkeletonComponent = ({ count = 6 }: MessageListSkeletonProps) => {
    // Create a varied pattern of messages
    const skeletonPattern = [
        { isOwn: false, hasMedia: false },
        { isOwn: false, hasMedia: false },
        { isOwn: true, hasMedia: false },
        { isOwn: true, hasMedia: true },
        { isOwn: false, hasMedia: false },
        { isOwn: true, hasMedia: false },
    ]

    return (
        <div className="flex-1 px-1 pt-3 pb-2 space-y-1">
            {Array.from({ length: count }).map((_, index) => {
                const pattern = skeletonPattern[index % skeletonPattern.length]
                return (
                    <MessageSkeleton
                        key={index}
                        isOwn={pattern.isOwn}
                        hasMedia={pattern.hasMedia}
                    />
                )
            })}
        </div>
    )
}

export const MessageListSkeleton = memo(MessageListSkeletonComponent)
MessageListSkeleton.displayName = 'MessageListSkeleton'
