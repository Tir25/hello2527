import { type ReactNode } from 'react'
import { Sidebar } from '@/components/features/Sidebar'
import { NavigationOrb } from '@/components/ui/NavigationOrb'
import { useChatStore } from '@/store/chatStore'

interface ChatLayoutProps {
  children: ReactNode
}

export const ChatLayout = ({ children }: ChatLayoutProps) => {
  const { selectedUser } = useChatStore()

  return (
    <div className="h-full w-full flex overflow-hidden relative">
      {/* Left Pane - Sidebar */}
      <aside
        className={`${
          selectedUser ? 'hidden md:flex' : 'flex'
        } w-full md:w-[400px] flex-shrink-0 flex-col overflow-hidden`}
        aria-label="Conversation sidebar"
        role="complementary"
      >
        <Sidebar />
      </aside>

      {/* Right Pane - Main Chat Area */}
      <main
        className={`${
          !selectedUser ? 'hidden md:flex' : 'flex'
        } flex-1 flex flex-col overflow-hidden`}
        role="main"
        aria-label="Active chat"
      >
        {children}
      </main>

      {/* Global floating navigation orb */}
      {/* Only show orb when no chat is open to avoid overlapping the input box on all screens */}
      {!selectedUser && <NavigationOrb />}
    </div>
  )
}

