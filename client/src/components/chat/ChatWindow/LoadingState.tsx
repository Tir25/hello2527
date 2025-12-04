/**
 * Loading State Component
 * 
 * Responsibility: Displays loading spinner
 * Layer: UI Component (View)
 */

export const LoadingState = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <p className="text-gray-500">Loading messages...</p>
            </div>
        </div>
    )
}
