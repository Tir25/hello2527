/**
 * MessageFooter Component
 * 
 * Displays timestamp, edited indicator, and message status.
 * Extracted from MessageBubble for reusability.
 * 
 * Features:
 * - High contrast timestamps with text shadow on gradient backgrounds
 * - Edited indicator
 * - Read/Delivered/Sent status icons
 */

import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import { MessageTimestamp } from './MessageTimestamp'
import { MessageStatus } from './MessageStatus'
import { cn } from '@/utils/cn'

interface MessageFooterProps {
    message: DatabaseMessage
    isOwn: boolean
    isEdited: boolean
    recipientProfile?: Profile | null
    isLastMessage: boolean
}

export const MessageFooter = ({
    message,
    isOwn,
    isEdited,
    recipientProfile,
    isLastMessage,
}: MessageFooterProps) => {
    return (
        <div
            className={cn(
                "flex items-center justify-end gap-1.5 mt-2",
                isOwn
                    // Higher contrast for sent messages (white with shadow)
                    ? "text-white"
                    : "text-gray-500"
            )}
            style={isOwn ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : undefined}
        >
            {isEdited && (
                <span className="text-[10px] sm:text-[11px] opacity-80 mr-1 italic">
                    edited
                </span>
            )}
            <MessageTimestamp
                timestamp={message.created_at}
                className={cn(
                    "text-[11px] sm:text-xs font-medium",
                    isOwn ? "opacity-90" : "opacity-80"
                )}
            />
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
