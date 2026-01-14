/**
 * ChatHeader Component
 * 
 * Header for chat window showing user/group info and action buttons.
 * @module components/features/ChatHeader
 */

import { memo } from 'react'
import type { ChatHeaderProps } from './types'
import { BackButton } from './BackButton'
import { HeaderAvatar } from './HeaderAvatar'
import { UserInfo } from './UserInfo'
import { HeaderActions } from './HeaderActions'

export const ChatHeader = memo(function ChatHeader({
    selectedUser,
    onBack,
    showBackButton = true,
    isGroup = false,
    isOnline = false,
    groupName,
    groupAvatar,
    memberCount,
    onGroupInfoClick,
    onGalleryClick,
    onVideoCall,
    onVoiceCall,
    callsEnabled = true,
}: ChatHeaderProps) {
    // Determine display values
    const displayName = isGroup
        ? groupName || 'Group'
        : selectedUser.full_name || selectedUser.username || 'User'

    const avatarUrl = isGroup
        ? groupAvatar
        : selectedUser.avatar_url

    const subtitle = !isGroup
        ? (selectedUser.username || selectedUser.email) ?? undefined
        : undefined

    return (
        <header className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
            {/* Back button (mobile) */}
            <BackButton onClick={onBack} visible={showBackButton} />

            {/* Avatar */}
            <HeaderAvatar
                avatarUrl={avatarUrl}
                name={displayName}
                isGroup={isGroup}
                isOnline={isOnline}
                onClick={isGroup ? onGroupInfoClick : undefined}
            />

            {/* User/Group Info */}
            <UserInfo
                name={displayName}
                subtitle={subtitle}
                isGroup={isGroup}
                memberCount={memberCount}
                onClick={isGroup ? onGroupInfoClick : undefined}
            />

            {/* Action Buttons */}
            <HeaderActions
                isGroup={isGroup}
                onGroupInfoClick={onGroupInfoClick}
                onGalleryClick={onGalleryClick}
                onVideoCall={onVideoCall}
                onVoiceCall={onVoiceCall}
                callsEnabled={callsEnabled}
            />
        </header>
    )
})
