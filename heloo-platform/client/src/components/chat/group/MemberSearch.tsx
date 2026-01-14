/**
 * MemberSearch Component
 * 
 * Provides search/filter functionality for group member lists.
 * Features:
 * - Debounced input for performance
 * - Clear button
 * - Accessibility support
 * 
 * @module components/chat/group/MemberSearch
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface MemberSearchProps {
    /** Callback when search query changes (debounced) */
    onSearch: (query: string) => void
    /** Placeholder text */
    placeholder?: string
    /** Additional CSS classes */
    className?: string
    /** Debounce delay in ms */
    debounceMs?: number
}

const MemberSearchComponent = ({
    onSearch,
    placeholder = 'Search members...',
    className,
    debounceMs = 200,
}: MemberSearchProps) => {
    const [query, setQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)

        // Debounce the search callback
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            onSearch(value.trim().toLowerCase())
        }, debounceMs)
    }, [onSearch, debounceMs])

    const handleClear = useCallback(() => {
        setQuery('')
        onSearch('')
        inputRef.current?.focus()
    }, [onSearch])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClear()
        }
    }, [handleClear])

    return (
        <div className={cn('relative', className)}>
            <div className="relative">
                {/* Search icon */}
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    aria-hidden="true"
                />

                {/* Input field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-9 py-2.5 text-sm text-gray-900
                              bg-gray-100 rounded-xl border border-transparent
                              focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300
                              placeholder:text-gray-400
                              transition-all duration-200"
                    aria-label="Search members"
                    autoComplete="off"
                    spellCheck={false}
                />

                {/* Clear button */}
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 
                                  w-6 h-6 flex items-center justify-center
                                  rounded-full hover:bg-gray-200 
                                  active:scale-95 transition-all"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                )}
            </div>
        </div>
    )
}

export const MemberSearch = memo(MemberSearchComponent)
MemberSearch.displayName = 'MemberSearch'
