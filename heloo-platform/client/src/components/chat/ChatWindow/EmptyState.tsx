import { MessageCircle } from 'lucide-react'

/**
 * Empty State Component
 * 
 * Responsibility: Displays when no messages exist
 * Layer: UI Component (View)
 */

interface EmptyStateProps {
    userName: string
}

export const EmptyState = ({ userName }: EmptyStateProps) => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-5 text-center px-6 max-w-md">
                <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-12 h-12 sm:w-10 sm:h-10 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-xl sm:text-lg font-semibold text-gray-800 mb-2">
                        No messages yet
                    </h3>
                    <p className="text-base sm:text-sm text-gray-500">
                        Start a conversation with <span className="font-medium text-purple-600">{userName}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
