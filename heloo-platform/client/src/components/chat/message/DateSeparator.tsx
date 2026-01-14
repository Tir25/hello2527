/**
 * DateSeparator Component
 * 
 * Displays a date divider between messages from different days.
 * Shows "Today", "Yesterday", or the formatted date.
 * 
 * Responsibility: Visual date separation in message list
 * Layer: UI Component (Presenter)
 */

import { memo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

interface DateSeparatorProps {
    date: Date | string
}

const DateSeparatorComponent = ({ date }: DateSeparatorProps) => {
    const dateObj = date instanceof Date ? date : new Date(date)

    const getDateLabel = (): string => {
        if (isToday(dateObj)) return 'Today'
        if (isYesterday(dateObj)) return 'Yesterday'

        // Check if this year
        const now = new Date()
        if (dateObj.getFullYear() === now.getFullYear()) {
            return format(dateObj, 'EEEE, MMMM d') // "Monday, December 25"
        }

        return format(dateObj, 'MMMM d, yyyy') // "December 25, 2023"
    }

    return (
        <div className="flex items-center justify-center py-4" role="separator" aria-label={getDateLabel()}>
            <div className="px-4 py-1.5 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <span className="text-xs font-medium text-gray-500">
                    {getDateLabel()}
                </span>
            </div>
        </div>
    )
}

export const DateSeparator = memo(DateSeparatorComponent)
DateSeparator.displayName = 'DateSeparator'
