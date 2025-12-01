import { type ReactNode } from 'react'
import { Sidebar } from '@/components/chat/Sidebar/Sidebar'
import { NavigationOrb } from '@/components/ui/NavigationOrb'
import { useChatStore } from '@/store/chatStore'

interface ChatLayoutProps {
  children: ReactNode
}

export const ChatLayout = ({ children }: ChatLayoutProps) => {
  const { selectedUser } = useChatStore()

  return (
    <div className="h-[100dvh] w-screen flex overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* Subtle background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Left Pane - Sidebar */}
      <aside
        className={`${
          selectedUser ? 'hidden md:flex' : 'flex'
        } w-full md:w-[400px] flex-shrink-0 flex-col overflow-hidden`}
      >
        <Sidebar />
      </aside>

      {/* Right Pane - Main Chat Area */}
      <main
        className={`${
          !selectedUser ? 'hidden md:flex' : 'flex'
        } flex-1 flex flex-col overflow-hidden`}
        role="main"
      >
        {children}
      </main>

      {/* Global floating navigation orb */}
      {/* Only show orb when no chat is open to avoid overlapping the input box on all screens */}
      {!selectedUser && <NavigationOrb />}
    </div>
  )
}

