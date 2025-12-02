import { ReactNode } from 'react'
import { useAuthListener } from '@/hooks/useAuthListener'
import { ToastContainer } from '@/components/ui/Toast'

interface RootLayoutProps {
  children: ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  useAuthListener()

  return (
    <div className="min-h-screen bg-[#04010a] bg-gradient-to-br from-[#030014] via-[#050026] to-[#050113] text-base text-white/90 antialiased">
      <ToastContainer />
      <div className="min-h-screen">{children}</div>
    </div>
  )
}

export default RootLayout


