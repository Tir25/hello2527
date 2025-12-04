import { motion, AnimatePresence } from 'framer-motion'
import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'
import { MessageBubble } from '@/components/chat/message/MessageBubble'

/**
 * Message List Component
 * 
 * Responsibility: Renders scrollable list of messages
 * Layer: UI Component (View)
 * 
 * Pure presentational - receives messages and refs via props
 */

export interface MessageListProps {
    messages: DatabaseMessage[]
    currentUserId: string
    recipientProfile?: Profile | null
    messagesContainerRef: React.RefObject<HTMLDivElement | null>
    messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export const MessageList = ({
    messages,
    currentUserId,
    recipientProfile,
    messagesContainerRef,
    messagesEndRef,
}: MessageListProps) => {
    return (
        <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overscroll-none px-2 pt-4 pb-1 messages-scroll"
            style={{ scrollBehavior: 'smooth' }}
        >
            <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                    const isLastMessage = index === messages.length - 1
                    return (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                duration: 0.2,
                                delay: index === messages.length - 1 ? 0.05 : 0,
                            }}
                        >
                            <MessageBubble
                                message={message}
                                isOwn={message.sender_id === currentUserId}
                                recipientProfile={recipientProfile}
                                isLastMessage={isLastMessage}
                            />
                        </motion.div>
                    )
                })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
    )
}
