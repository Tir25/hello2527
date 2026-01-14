/**
 * LoadingState Component
 * 
 * Displays skeleton loading state for chat messages.
 * Shows a realistic preview of what messages will look like.
 * 
 * Responsibility: Loading state UI
 * Layer: UI Component (Presenter)
 */

import { memo } from 'react'
import { MessageListSkeleton } from '@/components/chat/message/MessageSkeleton'

interface LoadingStateProps {
    /** Number of skeleton messages to show */
    skeletonCount?: number
}

const LoadingStateComponent = ({ skeletonCount = 6 }: LoadingStateProps) => {
    return (
        <div className="flex flex-col h-full">
            <MessageListSkeleton count={skeletonCount} />
        </div>
    )
}

export const LoadingState = memo(LoadingStateComponent)
LoadingState.displayName = 'LoadingState'
