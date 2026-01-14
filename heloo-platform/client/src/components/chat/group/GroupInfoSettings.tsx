/**
 * GroupInfoSettings Component
 * 
 * Settings section with mute toggle and shared media button.
 * 
 * Responsibility: Notification and media settings
 */

import { memo } from 'react'
import { Image } from 'lucide-react'
import { GroupMuteToggle } from './GroupMuteToggle'

interface GroupInfoSettingsProps {
    groupId: string
    mutedUntil: string | null
    onMuteChange: (until: string | null) => void
    onMediaGalleryClick: () => void
}

export const GroupInfoSettings = memo(({
    groupId,
    mutedUntil,
    onMuteChange,
    onMediaGalleryClick,
}: GroupInfoSettingsProps) => {
    return (
        <div className="flex-shrink-0">
            {/* Mute Toggle */}
            <div className="px-4 py-2 border-b border-gray-200/50">
                <GroupMuteToggle
                    groupId={groupId}
                    mutedUntil={mutedUntil}
                    onMuteChange={onMuteChange}
                />
            </div>

            {/* Media Gallery Button */}
            <button
                onClick={onMediaGalleryClick}
                className="mx-4 my-2 flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-gray-50 hover:bg-gray-100 active:scale-[0.98]
                          transition-all text-gray-700"
                aria-label="View shared media"
            >
                <Image className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Shared Media</span>
            </button>
        </div>
    )
})

GroupInfoSettings.displayName = 'GroupInfoSettings'
