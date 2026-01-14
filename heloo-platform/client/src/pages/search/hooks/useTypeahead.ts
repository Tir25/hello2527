/**
 * Typeahead Hook
 * 
 * Responsibility: Manage typeahead suggestions with debounced search
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Fast suggestions as user types
 * - Keyboard navigation (↑/↓/Enter/Esc)
 * - Race condition protection
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { logger } from '@/lib/logger'

export interface TypeaheadSuggestion {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
}

interface UseTypeaheadOptions {
    minChars?: number
    maxSuggestions?: number
    debounceMs?: number
}

interface UseTypeaheadReturn {
    suggestions: TypeaheadSuggestion[]
    loading: boolean
    selectedIndex: number
    isOpen: boolean
    fetchSuggestions: (query: string) => void
    selectSuggestion: (suggestion: TypeaheadSuggestion) => void
    handleKeyDown: (e: React.KeyboardEvent, onSelect: (username: string) => void) => void
    close: () => void
}

const DEFAULT_OPTIONS: Required<UseTypeaheadOptions> = {
    minChars: 2,
    maxSuggestions: 5,
    debounceMs: 150,
}

export const useTypeahead = (options?: UseTypeaheadOptions): UseTypeaheadReturn => {
    const { minChars, maxSuggestions, debounceMs } = { ...DEFAULT_OPTIONS, ...options }
    const { user } = useAuthStore()

    const [suggestions, setSuggestions] = useState<TypeaheadSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isOpen, setIsOpen] = useState(false)

    // Request versioning for race condition protection
    const requestVersionRef = useRef(0)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    const fetchSuggestions = useCallback((query: string) => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        const trimmed = query.trim()

        // Close if query too short
        if (trimmed.length < minChars) {
            setSuggestions([])
            setIsOpen(false)
            setLoading(false)
            return
        }

        setLoading(true)

        // Debounce the fetch
        debounceTimerRef.current = setTimeout(async () => {
            const currentVersion = ++requestVersionRef.current

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .or(`username.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
                    .neq('id', user?.id || '')
                    .limit(maxSuggestions)

                // Race condition check
                if (currentVersion !== requestVersionRef.current) {
                    return
                }

                if (error) {
                    logger.error('useTypeahead', 'Failed to fetch suggestions', error)
                    setSuggestions([])
                } else {
                    setSuggestions(data || [])
                    setIsOpen((data?.length || 0) > 0)
                }
            } catch (error) {
                if (currentVersion === requestVersionRef.current) {
                    logger.error('useTypeahead', 'Unexpected error', error)
                    setSuggestions([])
                }
            } finally {
                if (currentVersion === requestVersionRef.current) {
                    setLoading(false)
                }
            }
        }, debounceMs)
    }, [user?.id, minChars, maxSuggestions, debounceMs])

    const selectSuggestion = useCallback((_suggestion: TypeaheadSuggestion) => {
        setIsOpen(false)
        setSuggestions([])
        setSelectedIndex(-1)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
        setSelectedIndex(-1)
    }, [])

    const handleKeyDown = useCallback((
        e: React.KeyboardEvent,
        onSelect: (username: string) => void
    ) => {
        if (!isOpen || suggestions.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                )
                break
            case 'Enter':
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    e.preventDefault()
                    const selected = suggestions[selectedIndex]
                    const searchTerm = selected.username || selected.full_name || ''
                    onSelect(searchTerm)
                    selectSuggestion(selected)
                }
                break
            case 'Escape':
                e.preventDefault()
                close()
                break
        }
    }, [isOpen, suggestions, selectedIndex, selectSuggestion, close])

    return {
        suggestions,
        loading,
        selectedIndex,
        isOpen,
        fetchSuggestions,
        selectSuggestion,
        handleKeyDown,
        close,
    }
}
