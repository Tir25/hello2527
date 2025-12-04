/**
 * Loading State Component
 * 
 * Responsibility: Displays loading skeletons
 * Layer: UI Component (View)
 */

export const LoadingState = () => {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/30 animate-pulse"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}
