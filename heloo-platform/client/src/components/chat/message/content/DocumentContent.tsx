/**
 * DocumentContent Component
 * 
 * Renders document attachments with download link.
 */

import { motion } from 'framer-motion'
import { FileText, Download } from 'lucide-react'
import { getSanitizedFilenameFromUrl } from '@/lib/utils/media'
import { MessageStatus } from '../MessageStatus'
import { MessageTimestamp } from '../MessageTimestamp'
import type { MediaContentProps } from './types'

export const DocumentContent = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    displayUrl,
    hasTextContent,
}: MediaContentProps) => {
    const sanitizedFilename = getSanitizedFilenameFromUrl(displayUrl || '')

    return (
        <motion.a
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            href={message.media_url || ''}
            target="_blank"
            rel="noopener noreferrer"
            download={sanitizedFilename}
            className={`mb-1.5 flex items-center gap-2.5 p-2.5 rounded-lg border border-white/20 ${isOwn ? 'bg-white/10' : 'bg-white/15'} hover:opacity-80 transition-opacity cursor-pointer`}
            aria-label={`Download document: ${sanitizedFilename}`}
        >
            <FileText size={20} className={isOwn ? 'text-white' : 'text-gray-700'} aria-hidden="true" />

            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                    {sanitizedFilename}
                </p>
                <p className={`text-xs truncate ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                    Click to download
                </p>
            </div>

            <Download size={18} className={isOwn ? 'text-white/70' : 'text-gray-500'} aria-hidden="true" />

            {/* Timestamp & Status (only for media-only messages) */}
            {!hasTextContent && (
                <div className="ml-2 flex items-center gap-1">
                    <MessageTimestamp
                        timestamp={message.created_at}
                        className={`text-[10px] whitespace-nowrap ${isOwn ? 'text-white/80' : 'text-gray-600'}`}
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
            )}
        </motion.a>
    )
}
