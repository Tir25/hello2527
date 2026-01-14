/**
 * GroupInfoMemberList Component
 * 
 * Members section with search, refresh, and add member controls.
 * Displays filtered member list with admin actions.
 * 
 * Note: This component renders inside a scrollable parent,
 * so it should NOT have its own scroll container.
 * 
 * Responsibility: Member list display and management
 */

import { memo } from 'react'
import { Loader2, UserPlus, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { MemberListItem } from './MemberListItem'
import { MemberSearch } from './MemberSearch'
import type { GroupMember } from '@/lib/services/group.service'

interface GroupInfoMemberListProps {
    members: GroupMember[]
    filteredMembers: GroupMember[]
    loading: boolean
    refreshing: boolean
    error: string | null
    isAdmin: boolean
    isMobile: boolean
    currentUserId: string | undefined
    removingUserId: string | null
    updatingRoleUserId: string | null
    memberSearchQuery: string
    onSearch: (query: string) => void
    onRefresh: () => void
    onAddMemberClick: () => void
    onRemoveMember: (userId: string, userName: string) => void
    onToggleRole: (userId: string, currentRole: 'admin' | 'member') => void
}

export const GroupInfoMemberList = memo(({
    members,
    filteredMembers,
    loading,
    refreshing,
    error,
    isAdmin,
    isMobile,
    currentUserId,
    removingUserId,
    updatingRoleUserId,
    memberSearchQuery,
    onSearch,
    onRefresh,
    onAddMemberClick,
    onRemoveMember,
    onToggleRole,
}: GroupInfoMemberListProps) => {
    return (
        // This component is inside a scrollable parent - no overflow here
        <div className="p-4 border-t border-gray-100">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">
                    Members ({members.length})
                </h4>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all
                                  disabled:opacity-50"
                        title="Refresh members"
                        aria-label="Refresh member list"
                    >
                        <RefreshCw className={cn("w-5 h-5 text-gray-500", refreshing && "animate-spin")} />
                    </button>
                    <button
                        onClick={onAddMemberClick}
                        disabled={!isAdmin}
                        className={cn(
                            "p-2 rounded-full transition-all active:scale-95",
                            isAdmin
                                ? "hover:bg-purple-100 text-purple-600"
                                : "opacity-50 cursor-not-allowed text-gray-400"
                        )}
                        title={isAdmin ? "Add member" : "Only admins can add members"}
                        aria-label="Add member"
                    >
                        <UserPlus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search Input - only show for larger groups */}
            {!loading && members.length > 5 && (
                <MemberSearch
                    onSearch={onSearch}
                    placeholder="Search members..."
                    className="mb-3"
                />
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button
                        onClick={onRefresh}
                        className="text-purple-600 text-sm font-medium hover:underline"
                    >
                        Try again
                    </button>
                </div>
            ) : filteredMembers.length === 0 && memberSearchQuery ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No members match "{memberSearchQuery}"</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredMembers.map(member => (
                        <MemberListItem
                            key={member.user_id}
                            member={member}
                            isCurrentUser={member.user_id === currentUserId}
                            isAdmin={isAdmin}
                            isMobile={isMobile}
                            isRemoving={removingUserId === member.user_id}
                            isUpdatingRole={updatingRoleUserId === member.user_id}
                            onRemove={() => onRemoveMember(
                                member.user_id,
                                member.profile?.full_name || member.profile?.username || 'User'
                            )}
                            onToggleRole={() => onToggleRole(member.user_id, member.role)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

GroupInfoMemberList.displayName = 'GroupInfoMemberList'
