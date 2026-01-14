import { ReactNode, lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuthListener'
import { ToastContainer } from '@/components/ui/Toast'
import { NavigationOrb } from '@/components/ui/navigationOrb'
import { CallProvider, useCall } from '@/context/call'
import { useStoryStore } from '@/store/storyStore'

// Lazy load VideoCallModal - only loads when a call is active
const VideoCallModal = lazy(() => import('@/components/call/VideoCallModal'))

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Inner layout content - separated to access CallContext
 */
const LayoutContent = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const storyViewerOpen = useStoryStore((s) => s.viewer.isOpen)
  const storyCreatorOpen = useStoryStore((s) => s.isCreatorOpen)
  const { isInCall } = useCall()

  const isChatRoute = location.pathname === '/'
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'

  // Hide NavigationOrb when story viewer or creator is open
  const showOrb = !isChatRoute && !isAuthRoute && !storyViewerOpen && !storyCreatorOpen

  return (
    <div className="min-h-screen relative">
      {children}

      {/* Only load VideoCallModal when in a call */}
      {isInCall && (
        <Suspense fallback={null}>
          <VideoCallModal />
        </Suspense>
      )}

      {showOrb && (
        <div className="md:hidden">
          <NavigationOrb />
        </div>
      )}
    </div>
  )
}

const RootLayout = ({ children }: RootLayoutProps) => {
  useAuthListener()

  return (
    <div className="min-h-screen bg-[#04010a] bg-gradient-to-br from-[#030014] via-[#050026] to-[#050113] text-base text-white/90 antialiased">
      <CallProvider>
        <ToastContainer />
        <LayoutContent>{children}</LayoutContent>
      </CallProvider>
    </div>
  )
}

export default RootLayout

