/**
 * PendingActions Component
 * 
 * Shows: Requested button with cancel option + Message button
 * Used when: Current user sent a follow request (pending outgoing)
 */

import { Clock, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { PendingActionsProps } from './types'

export const PendingActions = ({
    loading,
    onCancelRequest,
    onMessage,
}: PendingActionsProps) => {
    return (
        <div className="flex gap-3">
            <Button
                variant="secondary"
                onClick={onCancelRequest}
                isLoading={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600"
                aria-label="Cancel follow request"
            >
                <Clock size={18} />
                <span className="hidden sm:inline">Requested</span>
                <span className="sm:hidden">Pending</span>
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
