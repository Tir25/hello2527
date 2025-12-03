import { useSidebar } from '@/hooks/sidebar/useSidebar'
import { SidebarHeader } from './SidebarHeader'
import { UserProfile } from './UserProfile'
import { SearchSection } from './SearchSection'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'
import { ConversationList } from './ConversationList'

/**
 * Sidebar Container Component
 * 
 * Responsibility: Main sidebar container
 * Layer: UI Component (View)
 * 
 * Connects useSidebar hook to UI components
 */

export const Sidebar = () => {
    const {
        selectedUser,
        handleUserClick,
        searchQuery,
        handleSearchChange,
        showSearchResults,
        clearUserSearch,
        displayList,
        isLoading,
        error,
        retryFetch,
    } = useSidebar()

    return (
        <section
            className="h-full w-full sm:w-[320px] md:w-[400px] flex-shrink-0 backdrop-blur-xl bg-white/70 border-r border-white/20 flex flex-col shadow-lg"
            aria-label="Conversation panel"
        >
            {/* Header */}
            <header className="p-4 border-b border-white/20">
                <SidebarHeader />
                <UserProfile />
            </header>

            {/* Search */}
            <SearchSection
                searchQuery={searchQuery}
                onChange={handleSearchChange}
                showSearchResults={showSearchResults}
                onClearSearch={clearUserSearch}
            />

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-4 sidebar-scroll">
                {isLoading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState error={error} onRetry={retryFetch} />
                ) : displayList.length === 0 ? (
                    <EmptyState isSearch={showSearchResults} />
                ) : (
                    <ConversationList
                        users={displayList}
                        selectedUserId={selectedUser?.id}
                        onUserClick={handleUserClick}
                    />
                )}
            </div>
        </section>
    )
}
