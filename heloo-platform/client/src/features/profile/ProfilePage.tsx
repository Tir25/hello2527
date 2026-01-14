/**
 * ProfilePage (Refactored)
 * 
 * Responsibility: Assemble profile page from sub-components
 * Layer: UI (Container Component)
 * 
 * Max lines: ~80
 * 
 * Logic is in useProfilePage hook
 * UI is split into smaller components
 * 
 * Mobile-optimized with responsive padding and touch-friendly interactions
 */

import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useProfilePage } from './hooks/useProfilePage'
import {
  ProfileHeader,
  ProfileContent,
  PrivateAccountView,
  ProfileLoadingState,
  ProfileErrorState,
  BackgroundBlobs,
} from './components'

export const ProfilePage = () => {
  const navigate = useNavigate()
  const {
    profile,
    loading,
    error,
    isOwnProfile,
    isPrivate,
    handleProfileUpdate,
    handleRetry,
    handleBack,
  } = useProfilePage()

  // Performance: Respect user's motion preferences
  const prefersReducedMotion = useReducedMotion()

  // Loading state
  if (loading) {
    return <ProfileLoadingState />
  }

  // Error state
  if (error || !profile) {
    return <ProfileErrorState error={error} onRetry={handleRetry} />
  }

  return (
    <ErrorBoundary>
      {/* Responsive padding: tighter on mobile, more spacious on desktop */}
      <div className="min-h-screen px-3 py-4 sm:p-4 md:p-6 relative overflow-hidden safe-bottom bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Background Blobs - Light theme colors */}
        {!prefersReducedMotion && <BackgroundBlobs />}

        {/* Content - Improved spacing for mobile */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Back Button - Touch-friendly with 44px minimum target */}
          <motion.button
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            onClick={handleBack}
            className="p-2.5 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors backdrop-blur-sm bg-white/80 border border-gray-200 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={22} className="text-gray-700 sm:hidden" />
            <ArrowLeft size={24} className="text-gray-700 hidden sm:block" />
          </motion.button>

          {/* Profile Header */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.1 }}
          >
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
              onProfileUpdate={handleProfileUpdate}
            />
          </motion.div>

          {/* Content Section */}
          {isPrivate ? (
            <PrivateAccountView />
          ) : (
            <ProfileContent profile={profile} isOwnProfile={isOwnProfile} />
          )}
        </div>

        {/* Floating Settings Button - Only for own profile */}
        {isOwnProfile && (
          <motion.button
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.3 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            onClick={() => navigate('/settings')}
            className="fixed bottom-6 right-6 z-40 min-w-[56px] min-h-[56px] flex items-center justify-center 
              bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white 
              rounded-full shadow-lg hover:shadow-xl transition-shadow touch-manipulation"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
            aria-label="Open settings"
          >
            <Settings size={24} />
          </motion.button>
        )}
      </div>
    </ErrorBoundary>
  )
}
