/**
 * ConversationList Component
 * 
 * Renders list of users/conversations with error isolation.
 * Each conversation item is wrapped for independent error handling.
 * 
 * Responsibility: Render conversation list with animations
 * Layer: UI Component (View)
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'
import { UserItem } from '@/components/sidebar/UserItem'
import { ConversationErrorBoundary } from './ConversationErrorBoundary'
import type { SidebarDisplayItem } from '@/hooks/sidebar/useSidebar'
import type { Profile } from '@/lib/services/profile.service'

interface ConversationListProps {
    users: SidebarDisplayItem[]
    selectedUserId?: string
    onUserClick: (user: SidebarDisplayItem) => void
}

const ConversationListComponent = ({ users, selectedUserId, onUserClick }: ConversationListProps) => {
    const { fetchConversations, fetchArchivedConversations } = useChatStore()

    const handleArchiveChange = () => {
        void fetchConversations()
        void fetchArchivedConversations()
    }

    return (
        <nav aria-label="Conversation list">
            <ul className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {users.map((conversation) => (
                        <motion.li
                            key={conversation.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="list-none"
                        >
                            <ConversationErrorBoundary>
                                <UserItem
                                    user={conversation as Profile}
                                    isSelected={selectedUserId === conversation.id}
                                    onClick={() => onUserClick(conversation)}
                                    lastMessage={conversation.last_message ?? null}
                                    lastMessageTime={conversation.last_message_time ?? null}
                                    unreadCount={conversation.unread_count ?? 0}
                                    onArchiveChange={handleArchiveChange}

                                />
                            </ConversationErrorBoundary>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </nav>
    )
}

export const ConversationList = memo(ConversationListComponent)
ConversationList.displayName = 'ConversationList'
