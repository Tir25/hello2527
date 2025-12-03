import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'

/**
 * User Profile Component
 * 
 * Responsibility: Displays current user's profile info
 * Layer: UI Component (View)
 */

export const UserProfile = () => {
    const { user, profile, profileLoading } = useAuthStore()

    const displayName =
        profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30">
            <Avatar profile={profile} loading={profileLoading} size="md" isOnline={true} />
            <div className="flex-1 min-w-0">
                {profileLoading ? (
                    <>
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </>
                ) : (
                    <>
                        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </>
                )}
            </div>
        </div>
    )
}
