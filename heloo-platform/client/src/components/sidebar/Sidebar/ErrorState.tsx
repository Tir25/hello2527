import Button from '@/components/ui/Button'

/**
 * Error State Component
 * 
 * Responsibility: Displays error with retry button
 * Layer: UI Component (View)
 */

interface ErrorStateProps {
    error: string
    onRetry: () => void
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button variant="secondary" onClick={onRetry} className="text-xs">
                Retry
            </Button>
        </div>
    )
}
