/**
 * Notification Utilities
 * 
 * Time grouping and helper functions for activity notifications
 */

export type TimeSection = 'today' | 'thisWeek' | 'earlier'

export interface GroupedNotifications<T> {
    today: T[]
    thisWeek: T[]
    earlier: T[]
}

/**
 * Get the time section for a given date
 */
export const getTimeSection = (dateString: string): TimeSection => {
    const date = new Date(dateString)
    const now = new Date()

    // Start of today (midnight)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Start of week (Sunday)
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - dayOfWeek)

    if (date >= startOfToday) {
        return 'today'
    } else if (date >= startOfWeek) {
        return 'thisWeek'
    } else {
        return 'earlier'
    }
}

/**
 * Group items by time section
 */
export const groupByTime = <T extends { created_at: string }>(
    items: T[]
): GroupedNotifications<T> => {
    const grouped: GroupedNotifications<T> = {
        today: [],
        thisWeek: [],
        earlier: [],
    }

    items.forEach(item => {
        const section = getTimeSection(item.created_at)
        grouped[section].push(item)
    })

    return grouped
}

/**
 * Get label for time section
 */
export const getSectionLabel = (section: TimeSection): string => {
    switch (section) {
        case 'today':
            return 'Today'
        case 'thisWeek':
            return 'This Week'
        case 'earlier':
            return 'Earlier'
    }
}

/**
 * Check if a notification is "new" (within last 24 hours and unread)
 */
export const isNewNotification = (dateString: string): boolean => {
    const date = new Date(dateString)
    const now = new Date()
    const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
}

/**
 * Format relative time for notifications
 */
export const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
