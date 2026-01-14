/**
 * GroupInfoContent Component
 * 
 * Shared scrollable content for GroupInfoPanel (mobile and desktop).
 * @module components/chat/group/GroupInfoContent
 */

import { memo } from 'react'
import {
    GroupInfoProfile,
    GroupInfoSettings,
    GroupInfoMemberList,
} from './index'
import type { GroupMember } from '@/lib/services/group.service'
import type { User } from '@supabase/supabase-js'

interface GroupInfoContentProps {
    groupId: string
    groupName: string
    groupAvatar?: string | null
    groupDescription?: string | null
    members: GroupMember[]
    filteredMembers: GroupMember[]
    loading: boolean
    refreshing: boolean
    error: string | null
    isAdmin: boolean
    isMobile: boolean
    user: User | null
    mutedUntil: string | null
    removingUserId: string | null
    updatingRoleUserId: string | null
    memberSearchQuery: string
    onMuteChange: (until: string | null) => void
    onMediaGalleryClick: () => void
    onSearch: (query: string) => void
    onRefresh: () => void
    onAddMemberClick: () => void
    onRemoveMember: (userId: string, userName: string) => void
    onToggleRole: (userId: string, currentRole: 'admin' | 'member') => void
    onAvatarChange: (url: string) => void
}

const GroupInfoContentComponent = ({
    groupId,
    groupName,
    groupAvatar,
    groupDescription,
    members,
    filteredMembers,
    loading,
    refreshing,
    error,
    isAdmin,
    isMobile,
    user,
    mutedUntil,
    removingUserId,
    updatingRoleUserId,
    memberSearchQuery,
    onMuteChange,
    onMediaGalleryClick,
    onSearch,
    onRefresh,
    onAddMemberClick,
    onRemoveMember,
    onToggleRole,
    onAvatarChange,
}: GroupInfoContentProps) => {
    return (
        <>
            <GroupInfoProfile
                groupId={groupId}
                groupName={groupName}
                groupAvatar={groupAvatar}
                groupDescription={groupDescription}
                memberCount={members.length}
                isAdmin={isAdmin}
                onAvatarChange={onAvatarChange}
            />

            <GroupInfoSettings
                groupId={groupId}
                mutedUntil={mutedUntil}
                onMuteChange={onMuteChange}
                onMediaGalleryClick={onMediaGalleryClick}
            />

            <GroupInfoMemberList
                members={members}
                filteredMembers={filteredMembers}
                loading={loading}
                refreshing={refreshing}
                error={error}
                isAdmin={isAdmin}
                isMobile={isMobile}
                currentUserId={user?.id}
                removingUserId={removingUserId}
                updatingRoleUserId={updatingRoleUserId}
                memberSearchQuery={memberSearchQuery}
                onSearch={onSearch}
                onRefresh={onRefresh}
                onAddMemberClick={onAddMemberClick}
                onRemoveMember={onRemoveMember}
                onToggleRole={onToggleRole}
            />
        </>
    )
}

export const GroupInfoContent = memo(GroupInfoContentComponent)
GroupInfoContent.displayName = 'GroupInfoContent'
