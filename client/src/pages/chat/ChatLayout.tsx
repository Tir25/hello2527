import { type ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { NavigationOrb } from '@/components/ui/NavigationOrb'
import { useChatStore } from '@/store/chatStore'
import { usePresence } from '@/hooks/usePresence'
import { useAuthStore } from '@/store/authStore'

interface ChatLayoutProps {
  children: ReactNode
}

export const ChatLayout = ({ children }: ChatLayoutProps) => {
  const { selectedUser } = useChatStore()
  const { user } = useAuthStore()

  // Initialize socket.io presence connection
  usePresence(user?.id)

  return (
    <div className="h-full w-full flex overflow-hidden relative">
      {/* Left Pane - Sidebar */}
      <aside
        className={`${selectedUser ? 'hidden md:flex' : 'flex'
          } w-full md:w-[400px] flex-shrink-0 flex-col overflow-hidden`}
        aria-label="Conversation sidebar"
        role="complementary"
      >
        <Sidebar />
      </aside>

      {/* Right Pane - Main Chat Area */}
      <main
        className={`${!selectedUser ? 'hidden md:flex' : 'flex'
          } flex-1 flex flex-col overflow-hidden`}
        role="main"
        aria-label="Active chat"
      >
        {children}
      </main>

      {/* Mobile orb on conversation list (no active chat) */}
      {!selectedUser && (
        <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <NavigationOrb />
        </div>
      )}
    </div>
  )
}

