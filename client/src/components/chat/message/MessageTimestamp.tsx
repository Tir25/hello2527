import { format } from 'date-fns'

/**
 * Message Timestamp Component
 * 
 * Responsibility: Format and display message timestamp
 * Layer: UI Component (Presenter)
 * 
 * Pure presentational component - no logic, just formatting
 */

interface MessageTimestampProps {
    timestamp: Date | string
    className?: string
}

export const MessageTimestamp = ({ timestamp, className = '' }: MessageTimestampProps) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    const formattedTime = format(date, 'h:mm a')

    return <span className={className}>{formattedTime}</span>
}
