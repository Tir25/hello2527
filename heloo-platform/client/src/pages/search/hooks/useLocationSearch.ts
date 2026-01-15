/**
 * Location Search Hook
 * Searches locations using the location service
 * 
 * @module pages/search/hooks/useLocationSearch
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { searchLocations, searchLocationsInDb, type LocationData } from '@/services/locations'
import { useDebounce } from '@/hooks/useDebounce'
import { logger } from '@/lib/logger'

const DEBOUNCE_MS = 500

export interface UseLocationSearchReturn {
    query: string
    setQuery: (q: string) => void
    results: LocationData[]
    loading: boolean
    error: string | null
}

export function useLocationSearch(initialQuery: string = ''): UseLocationSearchReturn {
    const [query, setQuery] = useState(initialQuery)
    const [results, setResults] = useState<LocationData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
    const requestVersionRef = useRef(0)

    // Search when query changes
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([])
            setError(null)
            return
        }

        const search = async () => {
            const currentVersion = ++requestVersionRef.current
            setLoading(true)
            setError(null)

            try {
                // First search in our database
                const dbResults = await searchLocationsInDb(debouncedQuery)

                if (currentVersion !== requestVersionRef.current) return

                if (dbResults.length > 0) {
                    setResults(dbResults)
                } else {
                    // Fallback to Nominatim API
                    const apiResults = await searchLocations(debouncedQuery)

                    if (currentVersion !== requestVersionRef.current) return

                    setResults(apiResults)

                    if (apiResults.length === 0) {
                        setError('No locations found')
                    }
                }
            } catch (err) {
                if (currentVersion === requestVersionRef.current) {
                    logger.error('useLocationSearch', 'Search failed', err)
                    setError('Search failed')
                    setResults([])
                }
            } finally {
                if (currentVersion === requestVersionRef.current) {
                    setLoading(false)
                }
            }
        }

        search()
    }, [debouncedQuery])

    // Reset results when query is set externally
    const handleSetQuery = useCallback((q: string) => {
        setQuery(q)
        if (!q.trim()) {
            setResults([])
            setError(null)
        }
    }, [])

    return {
        query,
        setQuery: handleSetQuery,
        results,
        loading,
        error
    }
}
