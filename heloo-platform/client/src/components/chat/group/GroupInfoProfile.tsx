/**
 * GroupInfoProfile Component
 * 
 * Profile section showing group avatar, name, description, and member count.
 * Allows avatar upload for admins.
 * 
 * Responsibility: Group identity display
 */

import { memo } from 'react'
import { GroupAvatarUpload } from './GroupAvatarUpload'

interface GroupInfoProfileProps {
    groupId: string
    groupName: string
    groupAvatar: string | null | undefined
    groupDescription: string | null | undefined
    memberCount: number
    isAdmin: boolean
    onAvatarChange: (url: string) => void
}

export const GroupInfoProfile = memo(({
    groupId,
    groupName,
    groupAvatar,
    groupDescription,
    memberCount,
    isAdmin,
    onAvatarChange,
}: GroupInfoProfileProps) => {
    return (
        <div className="p-6 flex flex-col items-center border-b border-gray-200/50 flex-shrink-0">
            <GroupAvatarUpload
                groupId={groupId}
                currentAvatarUrl={groupAvatar ?? null}
                groupName={groupName}
                isAdmin={isAdmin}
                onAvatarChange={onAvatarChange}
                className="mb-3"
            />
            <h3 className="font-bold text-xl text-gray-900 text-center">{groupName}</h3>
            {groupDescription && (
                <p className="text-sm text-gray-500 mt-1 text-center max-w-[250px]">
                    {groupDescription}
                </p>
            )}
            <p className="text-sm text-gray-400 mt-2">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
        </div>
    )
})

GroupInfoProfile.displayName = 'GroupInfoProfile'
