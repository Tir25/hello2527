import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ChatLayout } from '@/pages/chat'
import { ChatWindow } from '@/components/chat/ChatWindow'

const ChatPage = () => (
  <DashboardLayout>
    <ChatLayout>
      <ChatWindow />
    </ChatLayout>
  </DashboardLayout>
)

export default ChatPage


