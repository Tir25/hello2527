import { format } from 'date-fns'

interface MessageTimestampProps {
  timestamp: string | Date
  className?: string
  size?: 'xs' | 'sm'
}

/**
 * Presenter component for formatting and displaying message timestamps
 */
export const MessageTimestamp = ({ 
  timestamp, 
  className = '', 
  size = 'xs' 
}: MessageTimestampProps) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const formattedTime = format(date, 'h:mm a')
  
  const sizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
  }

  return (
    <span className={`${sizeClasses[size]} whitespace-nowrap ${className}`}>
      {formattedTime}
    </span>
  )
}

