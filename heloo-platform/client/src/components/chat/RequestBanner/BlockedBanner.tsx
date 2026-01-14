/**
 * BlockedBanner Component
 * 
 * Banner shown when the user is blocked or has blocked someone.
 * @module components/chat/RequestBanner/BlockedBanner
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import Button from '@/components/ui/Button'
import GlassCard from '@/components/ui/GlassCard'

interface BlockedBannerProps {
    isBlocker: boolean
    loading: boolean
    onUnblock: () => void
}

export const BlockedBanner = memo(function BlockedBanner({
    isBlocker,
    loading,
    onUnblock,
}: BlockedBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/50"
        >
            <GlassCard variant="elevated" className="p-8 max-w-md mx-4 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center">
                        <Lock size={32} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {isBlocker ? 'You have blocked this user' : 'You are blocked'}
                        </h3>
                        <p className="text-white/60 mb-6">
                            {isBlocker
                                ? "You won't receive messages from this user."
                                : 'This user has blocked you. You cannot send messages.'}
                        </p>
                    </div>
                    {isBlocker && (
                        <Button
                            variant="primary"
                            onClick={onUnblock}
                            isLoading={loading}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
                            aria-label="Unblock user"
                        >
                            {loading ? 'Unblocking...' : 'Unblock User'}
                        </Button>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    )
})
