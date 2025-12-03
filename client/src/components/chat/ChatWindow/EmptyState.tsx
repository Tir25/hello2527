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
            <div className="flex flex-col items-center gap-4 text-center px-4 max-w-md">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        No messages yet
                    </h3>
                    <p className="text-gray-500">
                        Start a conversation with <span className="font-medium">{userName}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
