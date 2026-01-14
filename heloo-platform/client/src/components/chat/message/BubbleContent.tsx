/**
 * BubbleContent Component
 * 
 * Inner content of message bubble including reply, media, text, and footer.
 * @module components/chat/message/BubbleContent
 */

import { memo } from 'react'
import type { BubbleContentProps } from './types'
import { MessageContent } from './MessageContent'
import { MessageFooter } from './MessageFooter'
import { EditMessageForm } from './EditMessageForm'
import { ReplyContext } from './ReplyContext'
import { MentionHighlight } from '../mentions'
import { StoryMentionBubble } from './StoryMentionBubble'
import { StoryReplyBubble } from './StoryReplyBubble'
import { isStoryMentionPayload, isStoryReplyPayload } from '@/types/database.types'

const BubbleContentComponent = ({
    message,
    isOwn,
    isEditing,
    editContent,
    isEditLoading,
    hasTextContent,
    shouldShowFooter,
    isEdited,
    recipientProfile,
    isLastMessage,
    currentUserId,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    onEditKeyDown,
    onImageClick,
}: BubbleContentProps) => {
    return (
        <>
            {/* Reply Context - quoted message */}
            {message.reply_to && (
                <ReplyContext
                    replyTo={message.reply_to}
                    currentUserId={currentUserId}
                    isOwn={isOwn}
                    onClick={() => {
                        const replyEl = document.getElementById(`message-${message.reply_to?.id}`)
                        if (replyEl) {
                            replyEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            replyEl.classList.add('bg-amber-100/50')
                            setTimeout(() => replyEl.classList.remove('bg-amber-100/50'), 2000)
                        }
                    }}
                />
            )}

            {/* Story Mention Preview */}
            {!isEditing && isStoryMentionPayload(message.payload) && (
                <StoryMentionBubble {...message.payload} />
            )}

            {/* Story Reply Preview */}
            {!isEditing && isStoryReplyPayload(message.payload) && (
                <StoryReplyBubble {...message.payload} />
            )}

            {/* Media Content */}
            {!isEditing && (
                <MessageContent
                    message={message}
                    isOwn={isOwn}
                    recipientProfile={recipientProfile}
                    isLastMessage={isLastMessage}
                    onImageClick={onImageClick}
                />
            )}

            {/* Text Content or Edit Mode */}
            {isEditing ? (
                <EditMessageForm
                    editContent={editContent}
                    isLoading={isEditLoading}
                    onContentChange={onEditContentChange}
                    onSave={onSaveEdit}
                    onCancel={onCancelEdit}
                    onKeyDown={onEditKeyDown}
                />
            ) : (
                // Hide text when story payload exists (the bubble already has its own label)
                hasTextContent && !isStoryMentionPayload(message.payload) && !isStoryReplyPayload(message.payload) && (
                    <p className={`text-base sm:text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden ${isOwn ? 'text-white' : 'text-gray-800'}`}
                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <MentionHighlight content={message.content} isOwn={isOwn} />
                    </p>
                )
            )}

            {/* Footer */}
            {shouldShowFooter && !isEditing && (
                <MessageFooter
                    message={message}
                    isOwn={isOwn}
                    isEdited={isEdited}
                    recipientProfile={recipientProfile}
                    isLastMessage={isLastMessage ?? false}
                />
            )}
        </>
    )
}

export const BubbleContent = memo(BubbleContentComponent)
BubbleContent.displayName = 'BubbleContent'
