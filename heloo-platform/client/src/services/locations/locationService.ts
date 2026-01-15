/**
 * Location Search Service
 * Integrates with Nominatim (OpenStreetMap) for location search
 * 
 * @module services/locations/locationService
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Types
export interface NominatimResult {
    place_id: number
    lat: string
    lon: string
    display_name: string
    name?: string
    type: string
    address?: {
        city?: string
        town?: string
        village?: string
        state?: string
        country?: string
        country_code?: string
    }
}

export interface LocationData {
    id?: string
    placeId: string
    name: string
    displayName: string
    lat: number
    lng: number
    type: 'city' | 'poi' | 'address' | 'country' | 'state'
    countryCode?: string
}

// Cache for API results (in-memory, clears on reload)
const searchCache = new Map<string, LocationData[]>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL_MS = 1000 // Nominatim requires 1 req/sec

/**
 * Search locations using Nominatim API
 */
export async function searchLocations(query: string): Promise<LocationData[]> {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 2) return []

    // Check cache
    const cached = searchCache.get(trimmed)
    if (cached) {
        logger.debug('locationService', 'Cache hit', { query: trimmed })
        return cached
    }

    // Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
        await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()

    try {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('q', query)
        url.searchParams.set('format', 'json')
        url.searchParams.set('limit', '10')
        url.searchParams.set('addressdetails', '1')

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'HeLoo-App/1.0'  // Required by Nominatim
            }
        })

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`)
        }

        const results: NominatimResult[] = await response.json()

        const locations: LocationData[] = results.map(r => ({
            placeId: `osm:${r.place_id}`,
            name: r.name || r.address?.city || r.address?.town || r.address?.village || r.display_name.split(',')[0],
            displayName: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            type: mapNominatimType(r.type),
            countryCode: r.address?.country_code?.toUpperCase()
        }))

        // Cache results
        searchCache.set(trimmed, locations)
        setTimeout(() => searchCache.delete(trimmed), CACHE_TTL_MS)

        logger.info('locationService', 'Search complete', { query, count: locations.length })
        return locations

    } catch (error) {
        logger.error('locationService', 'Search failed', error)
        return []
    }
}

/**
 * Map Nominatim type to our type enum
 */
function mapNominatimType(type: string): LocationData['type'] {
    const cityTypes = ['city', 'town', 'village', 'municipality', 'hamlet']
    const countryTypes = ['country']
    const stateTypes = ['state', 'province', 'region']
    const poiTypes = ['restaurant', 'hotel', 'museum', 'park', 'shop', 'tourism']

    if (cityTypes.includes(type)) return 'city'
    if (countryTypes.includes(type)) return 'country'
    if (stateTypes.includes(type)) return 'state'
    if (poiTypes.includes(type)) return 'poi'
    return 'address'
}

/**
 * Save location to database (upsert by place_id)
 */
export async function saveLocation(location: LocationData): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('locations')
            .upsert({
                place_id: location.placeId,
                name: location.name,
                display_name: location.displayName,
                lat: location.lat,
                lng: location.lng,
                type: location.type,
                country_code: location.countryCode
            }, {
                onConflict: 'place_id',
                ignoreDuplicates: false
            })
            .select('id')
            .single()

        if (error) {
            logger.error('locationService', 'Save failed', error)
            return null
        }

        return data.id
    } catch (error) {
        logger.error('locationService', 'Save error', error)
        return null
    }
}

/**
 * Link a story to a location
 */
export async function linkStoryToLocation(storyId: string, locationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('story_locations')
            .insert({ story_id: storyId, location_id: locationId })

        if (error) {
            logger.error('locationService', 'Link failed', error)
            return false
        }

        return true
    } catch (error) {
        logger.error('locationService', 'Link error', error)
        return false
    }
}

/**
 * Get stories for a location
 */
export async function getStoriesByLocation(locationId: string): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('story_locations')
            .select('story_id')
            .eq('location_id', locationId)

        if (error) {
            logger.error('locationService', 'Get stories failed', error)
            return []
        }

        return data.map(r => r.story_id)
    } catch (error) {
        logger.error('locationService', 'Get stories error', error)
        return []
    }
}

/**
 * Search locations in database
 */
export async function searchLocationsInDb(query: string): Promise<LocationData[]> {
    try {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('story_count', { ascending: false })
            .limit(20)

        if (error) {
            logger.error('locationService', 'DB search failed', error)
            return []
        }

        return data.map(r => ({
            id: r.id,
            placeId: r.place_id,
            name: r.name,
            displayName: r.display_name,
            lat: r.lat,
            lng: r.lng,
            type: r.type as LocationData['type'],
            countryCode: r.country_code
        }))
    } catch (error) {
        logger.error('locationService', 'DB search error', error)
        return []
    }
}
