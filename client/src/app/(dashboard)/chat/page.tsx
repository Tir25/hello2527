import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ChatLayout } from '@/pages/chat'
import { ChatWindow } from '@/components/features/ChatWindow'

const ChatPage = () => (
  <DashboardLayout hideTopNav>
    <ChatLayout>
      <ChatWindow />
    </ChatLayout>
  </DashboardLayout>
)

export default ChatPage


