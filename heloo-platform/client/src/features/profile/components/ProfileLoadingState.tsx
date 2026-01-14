/**
 * ProfileLoadingState Component
 * 
 * Responsibility: Display loading spinner
 * Layer: UI (Dumb Component)
 * 
 * Uses light theme for consistency with other pages
 */

export const ProfileLoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Subtle background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-gray-600 text-sm font-medium">Loading profile...</p>
      </div>
    </div>
  )
}
