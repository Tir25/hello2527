/**
 * Search Header Component
 * 
 * Responsibility: Page header with search input and typeahead
 * Layer: UI Component (Presentational)
 * 
 * Features:
 * - Typeahead suggestions as user types
 * - Keyboard navigation (↑/↓/Enter/Esc)
 * - Auto-close when search results appear
 */

import { forwardRef, memo, useCallback, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useTypeahead } from '../hooks/useTypeahead'
import { TypeaheadDropdown } from './TypeaheadDropdown'
import type { TypeaheadSuggestion } from '../hooks/useTypeahead'

interface SearchHeaderProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    onClear: () => void
    loading: boolean
    hasResults?: boolean // True when main search has results
    onCommitSearch?: () => void // Called on Enter to save search to history
}

export const SearchHeader = memo(forwardRef<HTMLInputElement, SearchHeaderProps>(
    ({ searchQuery, onSearchChange, onClear, loading, hasResults = false, onCommitSearch }, ref) => {
        const {
            suggestions,
            selectedIndex,
            isOpen,
            fetchSuggestions,
            selectSuggestion,
            handleKeyDown,
            close,
        } = useTypeahead({ minChars: 2, maxSuggestions: 5 })

        // Fetch suggestions when query changes
        useEffect(() => {
            fetchSuggestions(searchQuery)
        }, [searchQuery, fetchSuggestions])

        // Close typeahead when main search results appear
        // This prevents overlap between typeahead dropdown and search results
        useEffect(() => {
            if (hasResults || loading) {
                close()
            }
        }, [hasResults, loading, close])

        // Handle suggestion selection
        const handleSuggestionSelect = useCallback((suggestion: TypeaheadSuggestion) => {
            const searchTerm = suggestion.username || suggestion.full_name || ''
            onSearchChange(searchTerm)
            selectSuggestion(suggestion)
        }, [onSearchChange, selectSuggestion])

        // Handle keyboard events
        const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            // Let typeahead handle keys when dropdown is open with suggestions
            handleKeyDown(e, (term) => {
                onSearchChange(term)
            })

            // If Enter was pressed and not handled by typeahead (no selection),
            // commit the current search to history
            if (e.key === 'Enter' && !e.defaultPrevented && onCommitSearch) {
                onCommitSearch()
            }
        }, [handleKeyDown, onSearchChange, onCommitSearch])

        // Clear and close
        const handleClear = useCallback(() => {
            onClear()
            close()
        }, [onClear, close])

        return (
            <div className="flex-none p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4 sm:mb-6 text-center">
                        Search
                    </h1>

                    {/* Search Input Container */}
                    <div className="relative">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                            size={20}
                            aria-hidden="true"
                        />
                        <input
                            ref={ref}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={onKeyDown}
                            onBlur={() => setTimeout(close, 150)}
                            placeholder="Search people..."
                            className="w-full pl-12 pr-10 py-3 sm:py-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-sm text-base"
                            aria-label="Search for users"
                            aria-expanded={isOpen}
                            aria-haspopup="listbox"
                            role="combobox"
                            autoComplete="off"
                        />

                        {/* Clear button */}
                        {searchQuery && !loading && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors z-10 touch-manipulation"
                                aria-label="Clear search"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        )}

                        {/* Loading spinner */}
                        {loading && searchQuery && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                                <div
                                    className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin"
                                    role="status"
                                    aria-label="Searching..."
                                />
                            </div>
                        )}

                        {/* Typeahead Dropdown - only show if no results yet */}
                        {!hasResults && (
                            <TypeaheadDropdown
                                suggestions={suggestions}
                                selectedIndex={selectedIndex}
                                isOpen={isOpen}
                                onSelect={handleSuggestionSelect}
                            />
                        )}
                    </div>
                </div>
            </div>
        )
    }
))

SearchHeader.displayName = 'SearchHeader'
