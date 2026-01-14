/**
 * Message Bubble Component - Production Optimized
 * 
 * Responsibility: Wrapper for message layout and alignment
 * Layer: UI Component (Presenter)
 * 
 * Performance: Wrapped with React.memo for render optimization
 * @module components/chat/message/MessageBubble
 */

import { useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { useLongPress } from '@/hooks/useLongPress'
import { useDoubleTap } from '@/hooks/useDoubleTap'
import { useMessageEditing } from '@/hooks/chat/useMessageEditing'
import { useReactions } from '@/hooks/chat/reactions'
import { MEDIA_PLACEHOLDER } from '@/lib/constants/media'
import { getConversationRoomId } from '@/utils/chat'

import type { MessageBubbleProps } from './types'
import { UnsentMessage } from './UnsentMessage'
import { GroupSenderAvatar, GroupSenderName } from './GroupSenderInfo'
import { ReactionTrigger } from './ReactionTrigger'
import { BubbleContent } from './BubbleContent'
import { ImageLightbox } from './ImageLightbox'
import { MessageContextMenu } from '../MessageContextMenu'
import { ReactionBar, ReactionPicker } from '../reactions'

const MessageBubbleComponent = ({
    message,
    isOwn,
    recipientProfile,
    isLastMessage = false,
    currentUserId,
    isGroup = false,
    isGroupAdmin = false,
    senderProfile,
    showSenderInfo = false,
}: MessageBubbleProps) => {
    // UI State
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
    const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
    const [reactionPickerPos, setReactionPickerPos] = useState<{ x: number; y: number } | null>(null)

    // Editing hook
    const editing = useMessageEditing({
        messageId: message.id,
        originalContent: message.content,
    })

    // Reactions hook
    const conversationId = getConversationRoomId(message.group_id, message.sender_id, message.receiver_id)
    const { reactions, toggleReaction, isLoading: isReactionsLoading } = useReactions(message.id, conversationId)

    // Event handlers
    const handleCloseLightbox = useCallback(() => setLightboxImage(null), [])
    const closeContextMenu = useCallback(() => setContextMenuPosition(null), [])

    const handleContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (e.cancelable) e.preventDefault()
        let clientX = 0, clientY = 0
        if ('touches' in e && e.touches?.length > 0) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else if ('clientX' in e) {
            clientX = e.clientX
            clientY = e.clientY
        }
        setContextMenuPosition({ x: clientX, y: clientY })
    }, [])

    const handleOpenReactionPicker = useCallback((pos: { x: number; y: number }) => {
        setReactionPickerPos(pos)
        setReactionPickerOpen(true)
    }, [])

    // Gesture handlers
    const longPressHandlers = useLongPress({ threshold: 500, onLongPress: handleContextMenu })
    const doubleTapHandlers = useDoubleTap({
        onDoubleTap: () => !message.is_unsent && toggleReaction('❤️'),
        enabled: !editing.isEditing,
    })

    // Early returns
    if (currentUserId && message.deleted_for?.includes(currentUserId)) return null

    // Derived state
    const isUnsent = message.is_unsent === true
    const isEdited = message.is_edited === true
    const hasMedia = message.media_url && message.media_type && !isUnsent
    const hasTextContent = message.content && message.content !== MEDIA_PLACEHOLDER && !isUnsent
    const shouldShowFooter = !(hasMedia && (!hasTextContent || message.media_type === 'audio'))

    // Unsent message
    if (isUnsent) {
        return (
            <UnsentMessage
                message={message}
                isOwn={isOwn}
                contextMenuPosition={contextMenuPosition}
                onContextMenu={handleContextMenu}
                onCloseContextMenu={closeContextMenu}
                onStartEditing={editing.startEditing}
                longPressHandlers={longPressHandlers}
            />
        )
    }

    return (
        <>
            <motion.div
                id={`message-${message.id}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-3 sm:px-4 transition-colors duration-500`}
            >
                {/* Group sender avatar */}
                {isGroup && !isOwn && senderProfile && (
                    <GroupSenderAvatar senderProfile={senderProfile} showSenderInfo={showSenderInfo} />
                )}
                {isGroup && !isOwn && !senderProfile && !showSenderInfo && (
                    <div className="w-7 mr-2 flex-shrink-0" />
                )}

                {/* Message wrapper */}
                <div className="flex items-end gap-1 group/message">
                    {isOwn && !editing.isEditing && !message.is_unsent && (
                        <ReactionTrigger position="left" onOpenPicker={handleOpenReactionPicker} />
                    )}

                    <div className="flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
                        {isGroup && !isOwn && showSenderInfo && senderProfile && (
                            <GroupSenderName senderProfile={senderProfile} />
                        )}

                        <div
                            className={`${isOwn
                                ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-2xl rounded-tr-md'
                                : 'bg-white/50 text-gray-900 rounded-2xl rounded-tl-md'
                                } ${hasMedia && !hasTextContent ? 'p-1.5' : 'px-4 py-3'} shadow-lg border border-white/20 select-none overflow-hidden`}
                            {...longPressHandlers}
                            {...doubleTapHandlers}
                        >
                            <BubbleContent
                                message={message}
                                isOwn={isOwn}
                                isEditing={editing.isEditing}
                                editContent={editing.editContent}
                                isEditLoading={editing.isEditLoading}
                                hasTextContent={!!hasTextContent}
                                shouldShowFooter={shouldShowFooter}
                                isEdited={isEdited}
                                recipientProfile={recipientProfile}
                                isLastMessage={isLastMessage}
                                currentUserId={currentUserId}
                                onEditContentChange={editing.setEditContent}
                                onSaveEdit={editing.saveEdit}
                                onCancelEdit={editing.cancelEditing}
                                onEditKeyDown={editing.handleKeyDown}
                                onImageClick={setLightboxImage}
                            />
                        </div>

                        {!editing.isEditing && reactions.length > 0 && (
                            <ReactionBar reactions={reactions} onToggle={toggleReaction} isLoading={isReactionsLoading} />
                        )}
                    </div>

                    {!isOwn && !editing.isEditing && !message.is_unsent && (
                        <ReactionTrigger position="right" onOpenPicker={handleOpenReactionPicker} />
                    )}
                </div>
            </motion.div>

            {contextMenuPosition && (
                <MessageContextMenu
                    message={message}
                    isOwn={isOwn}
                    position={contextMenuPosition}
                    onClose={closeContextMenu}
                    onEdit={editing.startEditing}
                    isGroup={isGroup}
                    isGroupAdmin={isGroupAdmin}
                    onReact={toggleReaction}
                />
            )}

            <ImageLightbox imageUrl={lightboxImage} onClose={handleCloseLightbox} />

            <ReactionPicker
                isOpen={reactionPickerOpen}
                onClose={() => setReactionPickerOpen(false)}
                onSelect={(emoji) => { toggleReaction(emoji); setReactionPickerOpen(false) }}
                position={reactionPickerPos ?? undefined}
            />
        </>
    )
}

export const MessageBubble = memo(
    MessageBubbleComponent,
    (prev, next) => {
        if (prev.message.id !== next.message.id) return false
        if (prev.message.content !== next.message.content) return false
        if (prev.message.status !== next.message.status) return false
        if (prev.message.is_unsent !== next.message.is_unsent) return false
        if (prev.message.is_edited !== next.message.is_edited) return false
        if (prev.isOwn !== next.isOwn) return false
        if (prev.isLastMessage !== next.isLastMessage) return false
        if (prev.recipientProfile?.avatar_url !== next.recipientProfile?.avatar_url) return false
        if (prev.message.deleted_for?.length !== next.message.deleted_for?.length) return false
        if (prev.message.reply_to?.id !== next.message.reply_to?.id) return false
        // Compare payload for story mentions and rich content
        if (prev.message.payload?.type !== next.message.payload?.type) return false
        return true
    }
)

MessageBubble.displayName = 'MessageBubble'
