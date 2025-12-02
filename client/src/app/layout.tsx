import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuthListener'
import { ToastContainer } from '@/components/ui/Toast'
import { NavigationOrb } from '@/components/ui/NavigationOrb'

interface RootLayoutProps {
  children: ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  useAuthListener()
  const location = useLocation()
  const isChatRoute = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#04010a] bg-gradient-to-br from-[#030014] via-[#050026] to-[#050113] text-base text-white/90 antialiased">
      <ToastContainer />
      <div className="min-h-screen relative">
        {children}
        {!isChatRoute && (
          <div className="md:hidden">
            <NavigationOrb />
          </div>
        )}
      </div>
    </div>
  )
}

export default RootLayout


