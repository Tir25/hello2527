/**
 * Profile Cache Service
 * 
 * Responsibility: Manage profile caching and request deduplication
 * Layer: Service (Data)
 */

import type { Profile, ProfileResponse, CacheEntry } from '../types/profile.types'

const CACHE_TTL = 5000 // 5 seconds cache TTL

// Profile cache
const profileCache = new Map<string, CacheEntry>()

// Request deduplication: Track in-flight requests
const pendingRequests = new Map<string, Promise<ProfileResponse>>()

export const profileCacheService = {
  /**
   * Get cached profile if valid
   */
  getCached(userId: string): Profile | null {
    const cached = profileCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    return null
  },

  /**
   * Set profile in cache
   */
  setCache(userId: string, data: Profile): void {
    profileCache.set(userId, {
      data,
      timestamp: Date.now(),
    })
  },

  /**
   * Clear cache for a specific user
   */
  clearCache(userId: string): void {
    profileCache.delete(userId)
  },

  /**
   * Clear cache for multiple users
   */
  clearMultiple(userIds: string[]): void {
    userIds.forEach(id => profileCache.delete(id))
  },

  /**
   * Get pending request if exists
   */
  getPendingRequest(userId: string): Promise<ProfileResponse> | undefined {
    return pendingRequests.get(userId)
  },

  /**
   * Set pending request
   */
  setPendingRequest(userId: string, promise: Promise<ProfileResponse>): void {
    pendingRequests.set(userId, promise)
  },

  /**
   * Remove pending request
   */
  removePendingRequest(userId: string): void {
    pendingRequests.delete(userId)
  },
}
