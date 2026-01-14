/**
 * RequestBanner Component
 * 
 * Displays banners for pending requests, blocked users, or follow prompts.
 * @module components/chat/RequestBanner
 */

import { memo } from 'react'
import type { RequestBannerProps } from './types'
import { useRequestActions } from './useRequestActions'
import { PendingRequestBanner } from './PendingRequestBanner'
import { BlockedBanner } from './BlockedBanner'
import { FollowToChatBanner } from './FollowToChatBanner'

export const RequestBanner = memo(function RequestBanner({
    userName,
    userId,
    relationshipStatus,
    isRequester,
    isBlocker = false,
    relationshipId,
    onStatusChange,
}: RequestBannerProps) {
    const {
        actionState,
        isAnyLoading,
        handleFollow,
        handleAccept,
        handleDecline,
        handleDeclineAndBlock,
        handleUnblock,
    } = useRequestActions({ userId, relationshipId, onStatusChange })

    // Pending request - current user is recipient
    if (relationshipStatus === 'pending' && !isRequester) {
        return (
            <PendingRequestBanner
                userName={userName}
                actionState={actionState}
                isAnyLoading={isAnyLoading}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onDeclineAndBlock={handleDeclineAndBlock}
            />
        )
    }

    // Blocked state
    if (relationshipStatus === 'blocked') {
        return (
            <BlockedBanner
                isBlocker={isBlocker}
                loading={actionState.loading}
                onUnblock={handleUnblock}
            />
        )
    }

    // No relationship - Follow to Chat
    if (relationshipStatus === 'none') {
        return (
            <FollowToChatBanner
                userName={userName}
                loading={actionState.followLoading}
                onFollow={handleFollow}
            />
        )
    }

    return null
})
