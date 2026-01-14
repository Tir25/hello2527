/**
 * ProfileErrorState Component
 * 
 * Responsibility: Display error state with retry
 * Layer: UI (Dumb Component)
 * 
 * Uses light theme for consistency with other pages
 */

import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

interface ProfileErrorStateProps {
  error: string | null
  onRetry: () => void
}

export const ProfileErrorState = ({ error, onRetry }: ProfileErrorStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Subtle background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center">
        <GlassCard variant="elevated" className="p-8 max-w-md bg-white/90 border-gray-200">
          <p className="text-gray-600 mb-4">
            {error || 'Failed to load profile. Please try again.'}
          </p>
          <Button onClick={onRetry}>Retry</Button>
        </GlassCard>
      </div>
    </div>
  )
}
