/**
 * FollowActions Component
 * 
 * Shows: Follow button + Message button
 * Used when: No relationship exists
 */

import { UserPlus, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { FollowActionsProps } from './types'

export const FollowActions = ({
    profile,
    loading,
    onFollow,
    onMessage,
}: FollowActionsProps) => {
    return (
        <div className="flex gap-3">
            <Button
                variant="primary"
                onClick={onFollow}
                isLoading={loading}
                className="flex-1 flex items-center justify-center gap-2"
                aria-label={`Follow ${profile.full_name || profile.username || 'user'}`}
            >
                <UserPlus size={18} />
                Follow
            </Button>
            <Button
                variant="secondary"
                onClick={onMessage}
                className="flex items-center justify-center gap-2 px-4 sm:flex-1"
                aria-label="Send message"
            >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">Message</span>
            </Button>
        </div>
    )
}
