/**
 * useStoryEditor Hook
 * Manages all story editor state: media, overlays, filters, stickers, scheduling
 * 
 * @module hooks/stories/useStoryEditor
 */

import { useState, useCallback, useRef } from 'react'
import type { TextOverlay, Sticker } from '@/types'

type EditorMode = 'camera' | 'editor'

interface UseStoryEditorReturn {
    // Mode
    mode: EditorMode
    setMode: (mode: EditorMode) => void

    // Media
    mediaBlob: Blob | null
    mediaPreview: string | null
    mediaType: 'image' | 'video'
    videoRef: React.RefObject<HTMLVideoElement | null>

    // Editor
    activeFilter: string
    setActiveFilter: (filter: string) => void
    textOverlays: TextOverlay[]
    stickers: Sticker[]
    scheduledTime: string | null
    setScheduledTime: (time: string | null) => void

    // Modals
    isTextEditorOpen: boolean
    setIsTextEditorOpen: (open: boolean) => void
    isStickerDrawerOpen: boolean
    setIsStickerDrawerOpen: (open: boolean) => void
    isScheduleDrawerOpen: boolean
    setIsScheduleDrawerOpen: (open: boolean) => void
    // Picker Modals
    isLocationPickerOpen: boolean
    setIsLocationPickerOpen: (open: boolean) => void
    isMentionPickerOpen: boolean
    setIsMentionPickerOpen: (open: boolean) => void
    isPollCreatorOpen: boolean
    setIsPollCreatorOpen: (open: boolean) => void
    isCountdownPickerOpen: boolean
    setIsCountdownPickerOpen: (open: boolean) => void
    isQuestionPickerOpen: boolean
    setIsQuestionPickerOpen: (open: boolean) => void
    // Audience
    audienceType: 'public' | 'close_friends'
    setAudienceType: (type: 'public' | 'close_friends') => void

    // Actions
    handleCapture: (blob: Blob, type: 'image' | 'video', previewUrl: string) => void
    handleGalleryUpload: (file: File) => void
    handleAddText: (text: string, color: string, font: string) => void
    handleTextDrag: (id: string, x: number, y: number) => void
    handleDeleteText: (id: string) => void
    handleAddSticker: (sticker: Omit<Sticker, 'id' | 'scale' | 'rotation'>) => void
    handleStickerDrag: (id: string, x: number, y: number) => void
    handleDeleteSticker: (id: string) => void
    resetState: () => void
}

/**
 * Manages all story editor state and actions
 */
export function useStoryEditor(): UseStoryEditorReturn {
    // Mode
    const [mode, setMode] = useState<EditorMode>('camera')

    // Media state
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null)
    const [mediaPreview, setMediaPreview] = useState<string | null>(null)
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
    const videoRef = useRef<HTMLVideoElement>(null)

    // Editor state
    const [activeFilter, setActiveFilter] = useState('none')
    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
    const [stickers, setStickers] = useState<Sticker[]>([])
    const [scheduledTime, setScheduledTime] = useState<string | null>(null)
    const [audienceType, setAudienceType] = useState<'public' | 'close_friends'>('public')

    // Modal states
    const [isTextEditorOpen, setIsTextEditorOpen] = useState(false)
    const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false)
    const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false)

    // Picker modal states
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
    const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false)
    const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false)
    const [isCountdownPickerOpen, setIsCountdownPickerOpen] = useState(false)
    const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false)

    // Reset all state
    const resetState = useCallback(() => {
        if (mediaPreview) URL.revokeObjectURL(mediaPreview)
        setMode('camera')
        setMediaBlob(null)
        setMediaPreview(null)
        setMediaType('image')
        setActiveFilter('none')
        setTextOverlays([])
        setStickers([])
        setScheduledTime(null)
        setAudienceType('public')
    }, [mediaPreview])

    // Handle camera capture
    const handleCapture = useCallback((blob: Blob, type: 'image' | 'video', previewUrl: string) => {
        setMediaBlob(blob)
        setMediaType(type)
        setMediaPreview(previewUrl)
        setMode('editor')
    }, [])

    // Handle gallery upload
    const handleGalleryUpload = useCallback((file: File) => {
        const url = URL.createObjectURL(file)
        setMediaBlob(file)
        setMediaType(file.type.startsWith('video') ? 'video' : 'image')
        setMediaPreview(url)
        setMode('editor')
    }, [])

    // Text overlay handlers
    const handleAddText = useCallback((text: string, color: string, font: string) => {
        setTextOverlays(prev => [...prev, {
            id: `t-${Date.now()}`,
            text, x: 0, y: 0, color, scale: 1, rotation: 0, font
        }])
    }, [])

    const handleTextDrag = useCallback((id: string, x: number, y: number) => {
        setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))
    }, [])

    const handleDeleteText = useCallback((id: string) => {
        setTextOverlays(prev => prev.filter(t => t.id !== id))
    }, [])

    // Sticker handlers
    const handleAddSticker = useCallback((sticker: Omit<Sticker, 'id' | 'scale' | 'rotation'>) => {
        setStickers(prev => [...prev, { ...sticker, id: `s-${Date.now()}`, scale: 1, rotation: 0 }])
    }, [])

    const handleStickerDrag = useCallback((id: string, x: number, y: number) => {
        setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
    }, [])

    const handleDeleteSticker = useCallback((id: string) => {
        setStickers(prev => prev.filter(s => s.id !== id))
    }, [])

    return {
        mode, setMode,
        mediaBlob, mediaPreview, mediaType, videoRef,
        activeFilter, setActiveFilter,
        textOverlays, stickers,
        scheduledTime, setScheduledTime,
        isTextEditorOpen, setIsTextEditorOpen,
        isStickerDrawerOpen, setIsStickerDrawerOpen,
        isScheduleDrawerOpen, setIsScheduleDrawerOpen,
        isLocationPickerOpen, setIsLocationPickerOpen,
        isMentionPickerOpen, setIsMentionPickerOpen,
        isPollCreatorOpen, setIsPollCreatorOpen,
        isCountdownPickerOpen, setIsCountdownPickerOpen,
        isQuestionPickerOpen, setIsQuestionPickerOpen,
        audienceType, setAudienceType,
        handleCapture, handleGalleryUpload,
        handleAddText, handleTextDrag, handleDeleteText,
        handleAddSticker, handleStickerDrag, handleDeleteSticker,
        resetState
    }
}
