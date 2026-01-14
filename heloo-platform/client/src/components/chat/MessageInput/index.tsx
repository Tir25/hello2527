import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessageInput } from '@/hooks/chat/useMessageInput'
import { useMentions } from '@/hooks/chat/useMentions'
import { useChatStore } from '@/store/chatStore'
import { FilePreview } from './FilePreview'
import { InputArea } from './InputArea'
import { AttachButton } from './AttachButton'
import { SendButton } from './SendButton'
import { ReplyPreview } from './ReplyPreview'
import { MentionAutocomplete } from '../mentions'
import { groupService } from '@/lib/services/group.service'
import type { GroupMember } from '@/lib/services/group.service'

/**
 * Message Input Container Component
 * 
 * Responsibility: Main container that connects useMessageInput hook to UI
 * Layer: UI Component (View)
 * 
 * Features:
 * - Text input with auto-resize
 * - Media upload and preview
 * - Audio recording
 * - @mentions autocomplete (groups only)
 * - Reply/quote preview
 */

interface MessageInputProps {
    onSend: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document', replyToId?: string) => void
    disabled?: boolean
    placeholder?: string
    receiverId?: string
    groupId?: string
    isGroup?: boolean
    currentUserId?: string
}

export const MessageInput = ({
    onSend,
    disabled = false,
    placeholder = 'Type a message...',
    receiverId,
    groupId,
    isGroup = false,
    currentUserId,
}: MessageInputProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])

    // Reply state from store
    const replyingTo = useChatStore((state) => state.replyingTo)
    const clearReply = useChatStore((state) => state.clearReply)

    // Wrap onSend to include reply_to_id and clear reply after send
    const handleSendWithReply = async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document') => {
        // Must await onSend so sendGroupMessage can read replyingTo from store
        // before we clear it. This prevents a race condition where clearReply
        // runs before the message action reads the reply state.
        await onSend(content, mediaUrl, mediaType, replyingTo?.id)
        if (replyingTo) {
            clearReply()
        }
    }

    const {
        content,
        setContent,
        textareaRef,
        cursorPosition,
        setCursorPosition,
        handleSend,
        handleKeyDown: baseHandleKeyDown,
        canSend,
        filePreview,
        isUploading,
        uploadError,
        handleFileSelect,
        removePreview,
        retryUpload,
        isRecording,
        isRequestingMic,
        startRecording,
        stopRecording,
        handleTyping,
    } = useMessageInput({ onSend: handleSendWithReply, disabled, receiverId, groupId, isGroup })

    // Fetch group members for mentions (only for groups)
    useEffect(() => {
        if (isGroup && groupId) {
            groupService.getGroupMembers(groupId).then(result => {
                if (result.success && result.data) {
                    setGroupMembers(result.data)
                }
            })
        }
    }, [isGroup, groupId])

    // Mentions autocomplete
    const {
        isOpen: isMentionsOpen,
        query: mentionQuery,
        filteredMembers,
        selectedIndex,
        handleKeyDown: mentionsHandleKeyDown,
        handleSelect: handleMentionSelect,
    } = useMentions({
        content,
        cursorPosition,
        members: groupMembers,
        onContentChange: setContent,
        enabled: isGroup,
    })

    // Combined keyboard handler - mentions take priority
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // If mentions handled the key, don't process further
        if (mentionsHandleKeyDown(e)) return
        baseHandleKeyDown(e)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-chat-input flex-shrink-0 backdrop-blur-md bg-white/80 border-t border-white/20 px-3 py-2 safe-bottom mb-1 md:mb-1"
            role="region"
            aria-label="Message input area"
        >
            <div className="flex flex-col gap-2 max-w-3xl mx-auto relative">
                {/* Mention Autocomplete - positioned above input */}
                {isGroup && (
                    <MentionAutocomplete
                        query={mentionQuery}
                        members={filteredMembers}
                        isOpen={isMentionsOpen}
                        selectedIndex={selectedIndex}
                        onSelect={handleMentionSelect}
                        position={{ bottom: '100%', left: 0, marginBottom: 8 }}
                    />
                )}

                {/* Reply Preview */}
                <AnimatePresence>
                    {replyingTo && (
                        <ReplyPreview
                            message={replyingTo}
                            currentUserId={currentUserId}
                            onClose={clearReply}
                        />
                    )}
                </AnimatePresence>

                {/* File Preview */}
                <AnimatePresence>
                    {filePreview && (
                        <FilePreview
                            filePreview={filePreview}
                            isUploading={isUploading}
                            uploadError={uploadError}
                            onRemove={removePreview}
                            onRetry={retryUpload}
                        />
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="flex items-end">
                    {/* Input shell with pill-shaped edges */}
                    <div className="flex items-end gap-1.5 flex-1 bg-white/90 border border-white/50 rounded-3xl px-2.5 py-1.5 shadow-md">
                        {/* Attach Button */}
                        <AttachButton
                            isOpen={isMenuOpen}
                            onToggle={() => setIsMenuOpen(!isMenuOpen)}
                            disabled={disabled || isUploading}
                            isRecording={isRecording}
                            isRequestingMic={isRequestingMic}
                            onSelectImage={() => setIsMenuOpen(false)}
                            onSelectVideo={() => setIsMenuOpen(false)}
                            onSelectDocument={() => setIsMenuOpen(false)}
                            onStartRecording={() => {
                                startRecording()
                                setIsMenuOpen(false)
                            }}
                            onFileSelect={handleFileSelect}
                        />

                        {/* Text Input */}
                        <InputArea
                            value={content}
                            onChange={(value) => {
                                setContent(value)
                                handleTyping()
                            }}
                            onCursorChange={setCursorPosition}
                            onKeyDown={handleKeyDown}
                            disabled={disabled || isUploading}
                            placeholder={placeholder}
                            isRecording={isRecording}
                            isRequestingMic={isRequestingMic}
                            onStopRecording={stopRecording}
                            textareaRef={textareaRef}
                        />

                        {/* Send Button */}
                        <SendButton
                            onClick={handleSend}
                            disabled={disabled}
                            canSend={canSend}
                            isUploading={isUploading}
                        />
                    </div>
                </div>

                {/* Screen reader announcements */}
                {isRecording && (
                    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                        Recording audio
                    </div>
                )}
                {isRequestingMic && (
                    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                        Requesting microphone access
                    </div>
                )}
            </div>
        </motion.div>
    )
}
