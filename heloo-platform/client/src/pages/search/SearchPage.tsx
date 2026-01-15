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
 * - Location search tab (type=places)
 * 
 * This file was refactored from 523 lines to ~100 lines
 * Logic moved to: useSearchPage.ts, useLocationSearch.ts
 * UI components in: components/
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Users, MapPin } from 'lucide-react'
import { useSearchPage } from './useSearchPage'
import { useLocationSearch } from './hooks/useLocationSearch'
import {
  SearchHeader,
  RecentSearches,
  SearchResultList,
  LocationResults,
} from './components'
import type { LocationData } from '@/services/locations'

type SearchType = 'users' | 'places'

export const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Determine search type from URL
  const urlType = searchParams.get('type') as SearchType | null
  const urlQuery = searchParams.get('q') || ''
  const [searchType, setSearchType] = useState<SearchType>(urlType === 'places' ? 'places' : 'users')

  // User search hook
  const userSearch = useSearchPage()

  // Location search hook
  const locationSearch = useLocationSearch(urlType === 'places' ? urlQuery : '')

  // Sync URL query to search
  useEffect(() => {
    if (urlQuery && urlType === 'places') {
      locationSearch.setQuery(urlQuery)
    } else if (urlQuery) {
      userSearch.setSearchQuery(urlQuery)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle tab switch - memoized
  const handleTypeChange = useCallback((type: SearchType) => {
    setSearchType(type)
    // Clear other search
    if (type === 'users') {
      locationSearch.setQuery('')
    } else {
      userSearch.setSearchQuery('')
    }
  }, [locationSearch, userSearch])

  // Handle location select - memoized
  const handleLocationSelect = useCallback((location: LocationData) => {
    // Navigate to location page (future) or show stories at location
    navigate(`/search?q=${encodeURIComponent(location.name)}&type=places`)
  }, [navigate])

  // Memoized handlers to prevent re-renders
  const handleSwitchToUsers = useCallback(() => handleTypeChange('users'), [handleTypeChange])
  const handleSwitchToPlaces = useCallback(() => handleTypeChange('places'), [handleTypeChange])

  // Memoized clear handlers
  const handleClear = useMemo(() =>
    searchType === 'users'
      ? () => userSearch.setSearchQuery('')
      : () => locationSearch.setQuery('')
    , [searchType, userSearch, locationSearch])

  // Determine what to display - memoized
  const showSuggestions = useMemo(() =>
    !userSearch.searchQuery.trim() && userSearch.suggestedUsers.length > 0
    , [userSearch.searchQuery, userSearch.suggestedUsers.length])

  const displayUsers = useMemo(() =>
    userSearch.showSearchResults ? userSearch.searchResults : userSearch.suggestedUsers
    , [userSearch.showSearchResults, userSearch.searchResults, userSearch.suggestedUsers])

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Search Header */}
      <SearchHeader
        ref={userSearch.searchInputRef}
        searchQuery={searchType === 'users' ? userSearch.searchQuery : locationSearch.query}
        onSearchChange={searchType === 'users' ? userSearch.setSearchQuery : locationSearch.setQuery}
        onClear={handleClear}
        loading={searchType === 'users' ? userSearch.loading : locationSearch.loading}
        hasResults={searchType === 'users' ? userSearch.searchResults.length > 0 : locationSearch.results.length > 0}
        onCommitSearch={userSearch.commitSearch}
      />

      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={handleSwitchToUsers}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
            ${searchType === 'users' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
        <button
          onClick={handleSwitchToPlaces}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
            ${searchType === 'places' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}
        >
          <MapPin className="w-4 h-4" />
          Places
        </button>
      </div>

      {/* Users Tab */}
      {searchType === 'users' && (
        <>
          {/* Recent Searches Chips (cloud-synced) */}
          {!userSearch.searchQuery.trim() && (
            <RecentSearches
              searches={userSearch.recentSearches}
              loading={userSearch.recentSearchesLoading}
              onSearch={userSearch.handleQuickSearch}
              onClear={userSearch.handleClearRecentSearch}
              onClearAll={userSearch.handleClearAllHistory}
            />
          )}

          {/* Results List */}
          <SearchResultList
            users={displayUsers}
            loading={userSearch.loading}
            hasQuery={userSearch.showSearchResults}
            showSuggestions={showSuggestions}
            onViewProfile={userSearch.handleViewProfile}
            onMessage={userSearch.handleMessage}
          />
        </>
      )}

      {/* Places Tab */}
      {searchType === 'places' && (
        <LocationResults
          locations={locationSearch.results}
          loading={locationSearch.loading}
          hasQuery={!!locationSearch.query.trim()}
          onSelect={handleLocationSelect}
        />
      )}
    </div>
  )
}
