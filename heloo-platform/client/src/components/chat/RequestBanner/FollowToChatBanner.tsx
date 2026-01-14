/**
 * FollowToChat Banner Component
 * 
 * Banner shown when user needs to follow someone to chat.
 * @module components/chat/RequestBanner/FollowToChatBanner
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, UserPlus } from 'lucide-react'
import Button from '@/components/ui/Button'

interface FollowToChatBannerProps {
    userName: string
    loading: boolean
    onFollow: () => void
}

export const FollowToChatBanner = memo(function FollowToChatBanner({
    userName,
    loading,
    onFollow,
}: FollowToChatBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-none p-4 backdrop-blur-xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border-t border-purple-500/30"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-white/90">
                        You must follow <span className="font-semibold">{userName}</span> to send a message.
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={onFollow}
                    isLoading={loading}
                    disabled={loading}
                    className="flex-shrink-0 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 flex items-center justify-center gap-2"
                    aria-label={`Follow ${userName}`}
                >
                    {loading ? 'Following...' : <><UserPlus size={16} /> Follow</>}
                </Button>
            </div>
        </motion.div>
    )
})
