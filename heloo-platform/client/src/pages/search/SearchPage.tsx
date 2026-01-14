/**
 * SearchPage Component
 * 
 * Responsibility: Page coordinator - connects hook to UI components
 * Layer: UI Component (Page)
 * 
 * Features:
 * - Large centered search input with auto-focus
 * - Mobile-optimized list layout
 * - User items with Avatar and action buttons
 * - Skeleton loading for perceived performance
 * - Cloud-synced recent searches with clear all
 * - Recent viewed profiles when search is empty
 * 
 * This file was refactored from 523 lines to ~60 lines
 * Logic moved to: useSearchPage.ts
 * UI components in: components/
 */

import { useSearchPage } from './useSearchPage'
import {
  SearchHeader,
  RecentSearches,
  SearchResultList,
} from './components'

export const SearchPage = () => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    recentSearches,
    recentSearchesLoading,
    handleQuickSearch,
    handleClearRecentSearch,
    handleClearAllHistory,
    handleViewProfile,
    handleMessage,
    commitSearch,
    showSearchResults,
    suggestedUsers,
    searchInputRef,
  } = useSearchPage()

  // Determine what to display
  const showSuggestions = !searchQuery.trim() && suggestedUsers.length > 0
  const displayUsers = showSearchResults ? searchResults : suggestedUsers

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Search Header */}
      <SearchHeader
        ref={searchInputRef}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
        loading={loading}
        hasResults={searchResults.length > 0}
        onCommitSearch={commitSearch}
      />

      {/* Recent Searches Chips (cloud-synced) */}
      {!searchQuery.trim() && (
        <RecentSearches
          searches={recentSearches}
          loading={recentSearchesLoading}
          onSearch={handleQuickSearch}
          onClear={handleClearRecentSearch}
          onClearAll={handleClearAllHistory}
        />
      )}

      {/* Results List */}
      <SearchResultList
        users={displayUsers}
        loading={loading}
        hasQuery={showSearchResults}
        showSuggestions={showSuggestions}
        onViewProfile={handleViewProfile}
        onMessage={handleMessage}
      />
    </div>
  )
}
