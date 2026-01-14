/**
 * IncomingRequestActions Component
 * 
 * Shows: Accept + Decline buttons
 * Used when: Profile sent a follow request to current user (pending incoming)
 */

import { Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { IncomingRequestActionsProps } from './types'

export const IncomingRequestActions = ({
    profile,
    acceptLoading,
    declineLoading,
    onAccept,
    onDecline,
}: IncomingRequestActionsProps) => {
    return (
        <div className="flex gap-3">
            <Button
                variant="primary"
                onClick={onAccept}
                isLoading={acceptLoading}
                disabled={acceptLoading || declineLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600"
                aria-label={`Accept follow request from ${profile.full_name || profile.username || 'user'}`}
            >
                <Check size={18} />
                Accept
            </Button>
            <Button
                variant="secondary"
                onClick={onDecline}
                isLoading={declineLoading}
                disabled={acceptLoading || declineLoading}
                className="flex-1 flex items-center justify-center gap-2"
                aria-label={`Decline follow request from ${profile.full_name || profile.username || 'user'}`}
            >
                <X size={18} />
                Decline
            </Button>
        </div>
    )
}
