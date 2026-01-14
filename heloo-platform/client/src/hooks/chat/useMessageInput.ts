import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useTypingIndicator } from './useTypingIndicator'
import { useMediaUpload } from './useMediaUpload'
import { useAudioRecording } from './useAudioRecording'
import type { MediaType } from '@/services/media/mediaValidation.service'

/**
 * Message Input Hook
 * 
 * Responsibility: Main orchestrator for message input logic
 * Layer: Hook (Logic)
 * 
 * Features:
 * - Combines typing indicator, media upload, and audio recording hooks
 * - Manages text content state
 * - Auto-resize textarea logic
 * - Handles send message flow
 * - Keyboard event handling (Enter key)
 */

export interface UseMessageInputProps {
    onSend: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document') => void
    disabled?: boolean
    receiverId?: string
    // Group support
    groupId?: string
    isGroup?: boolean
}

export interface UseMessageInputReturn {
    // Text content state
    content: string
    setContent: (value: string) => void
    textareaRef: React.RefObject<HTMLTextAreaElement | null>
    cursorPosition: number
    setCursorPosition: (pos: number) => void

    // Send handlers
    handleSend: () => Promise<void>
    handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
    canSend: boolean

    // Media upload
    filePreview: ReturnType<typeof useMediaUpload>['filePreview']
    isUploading: ReturnType<typeof useMediaUpload>['isUploading']
    uploadError: ReturnType<typeof useMediaUpload>['uploadError']
    handleFileSelect: ReturnType<typeof useMediaUpload>['handleFileSelect']
    removePreview: ReturnType<typeof useMediaUpload>['removePreview']
    retryUpload: () => Promise<void>

    // Audio recording
    isRecording: ReturnType<typeof useAudioRecording>['isRecording']
    isRequestingMic: ReturnType<typeof useAudioRecording>['isRequestingMic']
    startRecording: () => Promise<void>
    stopRecording: ReturnType<typeof useAudioRecording>['stopRecording']

    // Typing indicator
    handleTyping: () => void
}

export const useMessageInput = ({
    onSend,
    disabled = false,
    receiverId,
    groupId,
    isGroup = false,
}: UseMessageInputProps): UseMessageInputReturn => {
    const [content, setContentInternal] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // setContent just updates internal state - cursor position is tracked via InputArea's onCursorChange
    const setContent = (value: string) => {
        setContentInternal(value)
    }

    // Use sub-hooks - for groups, use groupId instead of receiverId for typing
    const typingOptions = isGroup && groupId ? { groupId } : { receiverId }
    const { handleTyping, cleanupTyping } = useTypingIndicator(typingOptions, disabled)
    const {
        filePreview,
        isUploading,
        uploadError,
        handleFileSelect,
        handleUploadAndSend,
        removePreview,
        retryUpload: retryUploadInternal,
    } = useMediaUpload()
    const {
        isRecording,
        isRequestingMic,
        startRecording: startRecordingInternal,
        stopRecording,
    } = useAudioRecording()

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const scrollHeight = textareaRef.current.scrollHeight
            const maxHeight = 120
            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
        }
    }, [content])

    // MOBILE FIX: Scroll input into view when focused to prevent it being hidden by keyboard
    // This is the PRODUCTION version that's actually used (via ChatWindow/index.tsx)
    useEffect(() => {
        const handleFocus = () => {
            // Small delay to ensure keyboard has started appearing
            // This prevents the input from being hidden behind the virtual keyboard
            setTimeout(() => {
                textareaRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                })
            }, 300)
        }

        const textarea = textareaRef.current
        textarea?.addEventListener('focus', handleFocus)

        return () => {
            textarea?.removeEventListener('focus', handleFocus)
        }
    }, [])

    // Track cursor position on selection change
    useEffect(() => {
        const handleSelectionChange = () => {
            if (textareaRef.current && document.activeElement === textareaRef.current) {
                setCursorPosition(textareaRef.current.selectionStart || 0)
            }
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        return () => document.removeEventListener('selectionchange', handleSelectionChange)
    }, [])


    /**
     * Handles sending text or media message
     */
    const handleSend = async () => {
        const trimmedContent = content.trim()

        // Stop typing indicator when sending
        cleanupTyping()

        // Prevent double-click
        if (isUploading) return

        let messageSent = false

        // If there's a file preview, upload and send
        if (filePreview && !isUploading) {
            await handleUploadAndSend(filePreview.file, filePreview.type, (mediaUrl, mediaType) => {
                onSend(trimmedContent || '', mediaUrl, mediaType)
                setContent('')
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                }
                messageSent = true
            })
        } else if (trimmedContent && !disabled) {
            // Send text-only message
            onSend(trimmedContent)
            setContent('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
            messageSent = true
        }

        // UX ENHANCEMENT: Auto-focus input after sending for better mobile experience
        // Only focus if a message was actually sent (prevents focus on empty sends or early returns)
        if (messageSent) {
            setTimeout(() => {
                textareaRef.current?.focus()
            }, 100)
        }
    }

    /**
     * Handles Enter key to send message (Shift+Enter for new line)
     */
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    /**
     * Wrapper for startRecording with file select callback
     */
    const startRecording = async () => {
        await startRecordingInternal(async (file: File, type: MediaType) => {
            await handleFileSelect(file, type)
        })
    }

    /**
     * Wrapper for retryUpload with onSend callback
     */
    const retryUpload = async () => {
        await retryUploadInternal((mediaUrl, mediaType) => {
            onSend(content.trim() || '', mediaUrl, mediaType)
            setContent('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        })
    }

    const canSend = !!(content.trim() || filePreview)

    return {
        // Text content
        content,
        setContent,
        textareaRef,
        cursorPosition,
        setCursorPosition,

        // Send handlers
        handleSend,
        handleKeyDown,
        canSend,

        // Media upload
        filePreview,
        isUploading,
        uploadError,
        handleFileSelect,
        removePreview,
        retryUpload,

        // Audio recording
        isRecording,
        isRequestingMic,
        startRecording,
        stopRecording,

        // Typing
        handleTyping,
    }
}
