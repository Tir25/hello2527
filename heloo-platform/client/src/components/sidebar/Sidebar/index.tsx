import { ArrowLeft, Archive } from 'lucide-react'
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
        showArchived,
        toggleArchived,
        hasArchivedChats,
        displayList,
        isLoading,
        error,
        retryFetch,
    } = useSidebar()

    return (
        <section
            className="h-full w-full sm:w-[320px] md:w-[400px] flex-shrink-0 backdrop-blur-md bg-white/80 border-r border-white/30 flex flex-col shadow-lg"
            aria-label="Conversation panel"
        >
            {/* Header - Show back arrow when viewing archived chats */}
            {showArchived ? (
                <header className="p-4 border-b border-white/20">
                    <button
                        type="button"
                        onClick={toggleArchived}
                        className="flex items-center gap-3 w-full text-left group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                            <ArrowLeft size={18} className="text-purple-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Archive size={18} className="text-purple-500" />
                            <span className="text-lg font-semibold text-gray-800">Archived Chats</span>
                        </div>
                    </button>
                </header>
            ) : (
                <header className="p-4 border-b border-white/20">
                    <SidebarHeader />
                    <UserProfile />
                </header>
            )}

            {/* Search - Only show when not viewing archived */}
            {!showArchived && (
                <SearchSection
                    searchQuery={searchQuery}
                    onChange={handleSearchChange}
                    showSearchResults={showSearchResults}
                    onClearSearch={clearUserSearch}
                />
            )}

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-4 sidebar-scroll flex flex-col">
                {isLoading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState error={error} onRetry={retryFetch} />
                ) : displayList.length === 0 ? (
                    <EmptyState isSearch={showSearchResults} isArchived={showArchived} />
                ) : (
                    <>
                        <ConversationList
                            users={displayList}
                            selectedUserId={selectedUser?.id}
                            onUserClick={handleUserClick}
                        />
                        {/* Archive Toggle Button - Only show when NOT viewing archived */}
                        {!showArchived && hasArchivedChats && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <button
                                    type="button"
                                    onClick={toggleArchived}
                                    className="w-full px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Archive size={16} />
                                    Show Archived Chats
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}

