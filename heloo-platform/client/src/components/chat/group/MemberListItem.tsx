/**
 * MemberListItem Component
 * 
 * Displays a single group member with avatar, name, role badge,
 * and admin controls (promote/demote, remove).
 * 
 * Responsibility: Single member row rendering with actions
 */

import { memo } from 'react'
import { Crown, Loader2, UserMinus, Shield, ShieldOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { GroupMember } from '@/lib/services/group.service'

interface MemberListItemProps {
    member: GroupMember
    isCurrentUser: boolean
    isAdmin: boolean
    isMobile: boolean
    isRemoving: boolean
    isUpdatingRole: boolean
    onRemove: () => void
    onToggleRole: () => void
}

export const MemberListItem = memo(({
    member,
    isCurrentUser,
    isAdmin,
    isMobile,
    isRemoving,
    isUpdatingRole,
    onRemove,
    onToggleRole,
}: MemberListItemProps) => {
    const displayName = member.profile?.full_name || member.profile?.username || 'Unknown'
    const initial = displayName[0].toUpperCase()

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-gray-50/80",
                "hover:bg-gray-100/80 active:scale-[0.98] transition-all",
                isMobile && "min-h-[60px]"
            )}
        >
            {/* Avatar */}
            {member.profile?.avatar_url ? (
                <img
                    src={member.profile.avatar_url}
                    alt={displayName}
                    className={cn("rounded-full object-cover", isMobile ? "w-12 h-12" : "w-10 h-10")}
                />
            ) : (
                <div className={cn(
                    "rounded-full bg-gradient-to-br from-purple-400 to-pink-400",
                    "flex items-center justify-center text-white font-semibold",
                    isMobile ? "w-12 h-12" : "w-10 h-10"
                )}>
                    {initial}
                </div>
            )}

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                        {displayName}
                        {isCurrentUser && <span className="text-gray-400 ml-1">(You)</span>}
                    </p>
                    {member.role === 'admin' && (
                        <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                </div>
                {member.profile?.username && (
                    <p className="text-sm text-gray-500 truncate">
                        @{member.profile.username}
                    </p>
                )}
            </div>

            {/* Role badge */}
            <span className={cn(
                'text-xs px-2.5 py-1.5 rounded-full font-medium',
                member.role === 'admin'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
            )}>
                {member.role}
            </span>

            {/* Admin controls */}
            {isAdmin && !isCurrentUser && (
                <div className="flex items-center gap-1">
                    {/* Toggle role button */}
                    <button
                        onClick={onToggleRole}
                        disabled={isUpdatingRole}
                        className={cn(
                            "p-2 rounded-full transition-all active:scale-95",
                            member.role === 'admin'
                                ? "text-orange-500 hover:bg-orange-50"
                                : "text-blue-500 hover:bg-blue-50",
                            "disabled:opacity-50"
                        )}
                        title={member.role === 'admin' ? "Demote to member" : "Promote to admin"}
                        aria-label={member.role === 'admin' ? "Demote to member" : "Promote to admin"}
                    >
                        {isUpdatingRole ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : member.role === 'admin' ? (
                            <ShieldOff className="w-4 h-4" />
                        ) : (
                            <Shield className="w-4 h-4" />
                        )}
                    </button>

                    {/* Remove button */}
                    <button
                        onClick={onRemove}
                        disabled={isRemoving}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all
                                  disabled:opacity-50 active:scale-95"
                        title="Remove member"
                        aria-label={`Remove ${displayName}`}
                    >
                        {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserMinus className="w-4 h-4" />
                        )}
                    </button>
                </div>
            )}
        </div>
    )
})

MemberListItem.displayName = 'MemberListItem'
