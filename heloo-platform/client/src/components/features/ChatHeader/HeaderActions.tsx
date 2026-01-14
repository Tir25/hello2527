/**
 * HeaderActions Component
 * 
 * Action buttons in the chat header (call, gallery, info, etc.).
 * @module components/features/ChatHeader/HeaderActions
 */

import { memo } from 'react'
import { Video, Phone, Image, Info } from 'lucide-react'

interface HeaderActionsProps {
    isGroup: boolean
    onGroupInfoClick?: () => void
    onGalleryClick?: () => void
    onVideoCall?: () => void
    onVoiceCall?: () => void
    callsEnabled?: boolean
}

export const HeaderActions = memo(function HeaderActions({
    isGroup,
    onGroupInfoClick,
    onGalleryClick,
    onVideoCall,
    onVoiceCall,
    callsEnabled = true,
}: HeaderActionsProps) {
    return (
        <div className="flex items-center gap-1">
            {/* Video call button */}
            {callsEnabled && onVideoCall && (
                <button
                    onClick={onVideoCall}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Video call"
                >
                    <Video size={20} className="text-gray-600" />
                </button>
            )}

            {/* Voice call button */}
            {callsEnabled && onVoiceCall && (
                <button
                    onClick={onVoiceCall}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Voice call"
                >
                    <Phone size={20} className="text-gray-600" />
                </button>
            )}

            {/* Gallery button for DMs */}
            {!isGroup && onGalleryClick && (
                <button
                    onClick={onGalleryClick}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="View media gallery"
                >
                    <Image size={20} className="text-gray-600" />
                </button>
            )}

            {/* Info button for groups */}
            {isGroup && onGroupInfoClick && (
                <button
                    onClick={onGroupInfoClick}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="View group info"
                >
                    <Info size={20} className="text-gray-600" />
                </button>
            )}
        </div>
    )
})
