/**
 * Search Result List Component
 * 
 * Responsibility: Display search results or suggested users
 * Layer: UI Component (Presentational)
 */

import { memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'
import type { Profile } from '@/lib/services/profile.service'
import { UserListItem } from './UserListItem'
import { SearchSkeleton } from './SearchSkeleton'
import { SearchEmptyState } from './SearchEmptyState'

interface SearchResultListProps {
    users: Profile[]
    loading: boolean
    hasQuery: boolean
    showSuggestions: boolean
    onViewProfile: (profile: Profile) => void
    onMessage: (profile: Profile) => void
}

export const SearchResultList = memo(({
    users,
    loading,
    hasQuery,
    showSuggestions,
    onViewProfile,
    onMessage,
}: SearchResultListProps) => {
    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 safe-bottom">
            <div className="max-w-2xl mx-auto">
                {/* Section header */}
                {showSuggestions && (
                    <div className="mb-3 flex items-center gap-2 text-gray-500">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Recently Viewed</span>
                    </div>
                )}

                {hasQuery && !loading && (
                    <div className="mb-3 flex items-center gap-2 text-gray-500">
                        <span className="text-sm font-medium">
                            {users.length} {users.length === 1 ? 'result' : 'results'}
                        </span>
                    </div>
                )}

                {/* Loading state */}
                {loading && hasQuery ? (
                    <SearchSkeleton />
                ) : users.length === 0 ? (
                    <SearchEmptyState hasQuery={hasQuery} />
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {users.map((profile, index) => (
                                <UserListItem
                                    key={profile.id}
                                    profile={profile}
                                    onViewProfile={() => onViewProfile(profile)}
                                    onMessage={() => onMessage(profile)}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
})

SearchResultList.displayName = 'SearchResultList'
