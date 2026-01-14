/**
 * FollowBackActions Component
 * 
 * Shows: Follow Back + Message buttons
 * Used when: Profile follows current user, but current user doesn't follow back
 */

import { UserPlus, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { FollowBackActionsProps } from './types'

export const FollowBackActions = ({
    profile,
    loading,
    onFollow,
    onMessage,
}: FollowBackActionsProps) => {
    return (
        <div className="flex gap-3">
            <Button
                variant="primary"
                onClick={onFollow}
                isLoading={loading}
                className="flex-1 flex items-center justify-center gap-2"
                aria-label={`Follow back ${profile.full_name || profile.username || 'user'}`}
            >
                <UserPlus size={18} />
                Follow Back
            </Button>
            <Button
                variant="secondary"
                onClick={onMessage}
                className="flex-1 flex items-center justify-center gap-2"
                aria-label={`Message ${profile.full_name || profile.username || 'user'}`}
            >
                <MessageCircle size={18} />
                Message
            </Button>
        </div>
    )
}
