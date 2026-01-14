/**
 * MediaTimestampOverlay Component
 * 
 * Renders timestamp and message status overlay on media messages.
 * Used by ImageContent, VideoContent, etc.
 */

import { MessageStatus } from '../MessageStatus'
import { MessageTimestamp } from '../MessageTimestamp'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'

interface MediaTimestampOverlayProps {
    message: DatabaseMessage
    isOwn: boolean
    recipientProfile?: Profile | null
    isLastMessage?: boolean
    className?: string
}

export const MediaTimestampOverlay = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    className = '',
}: MediaTimestampOverlayProps) => {
    return (
        <div className={`rounded-full bg-black/65 text-white text-[10px] px-2 py-0.5 shadow-sm flex items-center gap-1 ${className}`}>
            <MessageTimestamp timestamp={message.created_at} />
            {isOwn && (
                <MessageStatus
                    status={
                        (['sent', 'delivered', 'seen'].includes(message.status)
                            ? message.status
                            : 'sent') as 'sent' | 'delivered' | 'seen'
                    }
                    recipientAvatar={recipientProfile?.avatar_url || null}
                    recipientThemeColor={recipientProfile?.theme_color || 'rgb(139, 92, 246)'}
                    isLastMessage={isLastMessage}
                />
            )}
        </div>
    )
}
