import { motion, AnimatePresence } from 'framer-motion'
import { UserItem } from '@/components/features/UserItem'
import type { Profile } from '@/lib/services/profile.service'
import type { ConversationProfile } from '@/lib/services/user.service'

/**
 * Conversation List Component
 * 
 * Responsibility: Renders list of users/conversations
 * Layer: UI Component (View)
 */

interface ConversationListProps {
    users: Profile[]
    selectedUserId?: string
    onUserClick: (user: Profile) => void
}

export const ConversationList = ({ users, selectedUserId, onUserClick }: ConversationListProps) => {
    return (
        <nav aria-label="Conversation list">
            <ul className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {users.map((listUser) => {
                        const lastMessage =
                            'last_message' in listUser
                                ? (listUser as ConversationProfile).last_message
                                : undefined

                        const lastMessageTime =
                            'last_message_time' in listUser
                                ? (listUser as ConversationProfile).last_message_time
                                : undefined

                        const unreadCount =
                            'unread_count' in listUser ? (listUser as ConversationProfile).unread_count : undefined

                        return (
                            <motion.li
                                key={listUser.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="list-none"
                            >
                                <UserItem
                                    user={listUser}
                                    isSelected={selectedUserId === listUser.id}
                                    onClick={() => onUserClick(listUser)}
                                    lastMessage={lastMessage}
                                    lastMessageTime={lastMessageTime}
                                    unreadCount={unreadCount}
                                />
                            </motion.li>
                        )
                    })}
                </AnimatePresence>
            </ul>
        </nav>
    )
}
