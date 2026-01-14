/**
 * PendingRequestBanner Component
 * 
 * Banner shown when there's a pending message request.
 * @module components/chat/RequestBanner/PendingRequestBanner
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import GlassCard from '@/components/ui/GlassCard'
import type { BannerActionState } from './types'

interface PendingRequestBannerProps {
    userName: string
    actionState: BannerActionState
    isAnyLoading: boolean
    onAccept: () => void
    onDecline: () => void
    onDeclineAndBlock: () => void
}

export const PendingRequestBanner = memo(function PendingRequestBanner({
    userName,
    actionState,
    isAnyLoading,
    onAccept,
    onDecline,
    onDeclineAndBlock,
}: PendingRequestBannerProps) {
    const { loading, declineLoading, blockLoading } = actionState

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-10 p-3 backdrop-blur-xl bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-b border-yellow-500/30"
        >
            <GlassCard variant="elevated" className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                                <span className="font-semibold">{userName}</span> wants to send you a message.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                        <Button
                            variant="primary"
                            onClick={onAccept}
                            isLoading={loading}
                            disabled={isAnyLoading}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
                            aria-label="Accept connection request"
                        >
                            {loading ? 'Accepting...' : <><Check size={16} /> Accept</>}
                        </Button>
                        <div className="flex gap-2 flex-1 sm:flex-none">
                            <Button
                                variant="secondary"
                                onClick={onDecline}
                                isLoading={declineLoading}
                                disabled={isAnyLoading}
                                className="flex-1 px-4 py-2 text-sm bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 border-gray-500/30 flex items-center justify-center gap-2"
                                aria-label="Decline request"
                            >
                                {declineLoading ? 'Declining...' : <><X size={16} /> Decline</>}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={onDeclineAndBlock}
                                isLoading={blockLoading}
                                disabled={isAnyLoading}
                                className="flex-1 px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30 flex items-center justify-center gap-2"
                                aria-label="Decline and block"
                            >
                                {blockLoading ? 'Blocking...' : <><X size={16} /> Block</>}
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
})
