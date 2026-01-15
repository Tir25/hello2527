/**
 * Story Creator Modal
 * Camera-first story creation with editor features
 * 
 * @module components/stories/StoryCreator
 */

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Send, Type, Smile, Clock, MapPin, AtSign, BarChart2, HelpCircle, Hash, Users } from 'lucide-react'
import { CameraCapture } from './CameraCapture'
import { useStoryUpload, useStoryEditor } from '@/hooks/stories'
import { TextEditor, StickerDrawer, FilterBar, ScheduleDrawer, DraggableOverlay, LocationPicker, MentionPicker, PollCreator } from './editor'
import type { AudienceType } from './editor/AudienceSelector'

interface StoryCreatorProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

const STICKER_ICONS = {
    location: MapPin,
    mention: AtSign,
    poll: BarChart2,
    question: HelpCircle,
    hashtag: Hash,
    countdown: Clock,
} as const

const STICKER_COLORS = {
    location: 'text-red-500',
    mention: 'text-blue-500',
    poll: 'text-green-500',
    question: 'text-purple-500',
    hashtag: 'text-cyan-500',
    countdown: 'text-orange-500',
} as const

/**
 * Story creation modal with camera and editor
 */
export const StoryCreator = memo(function StoryCreator({ isOpen, onClose, onSuccess }: StoryCreatorProps) {
    // All editor state from custom hook
    const editor = useStoryEditor()
    const { upload, isUploading, progress } = useStoryUpload()

    // Handle close
    const handleClose = useCallback(() => {
        if (isUploading) return
        editor.resetState()
        onClose()
    }, [isUploading, editor, onClose])

    // Handle post with specific audience
    const handlePost = useCallback(async (audienceType: AudienceType = 'public') => {
        if (!editor.mediaBlob || !editor.mediaPreview) return
        try {
            const file = editor.mediaBlob instanceof File
                ? editor.mediaBlob
                : new File([editor.mediaBlob], `story.${editor.mediaType === 'image' ? 'jpg' : 'webm'}`, { type: editor.mediaBlob.type })

            await upload({
                mediaFile: file,
                mediaType: editor.mediaType,
                filter: editor.activeFilter !== 'none' ? editor.activeFilter : undefined,
                textOverlays: editor.textOverlays.length > 0 ? editor.textOverlays : undefined,
                stickers: editor.stickers.length > 0 ? editor.stickers : undefined,
                scheduledAt: editor.scheduledTime,
                audienceType,
            })
            onSuccess?.()
            handleClose()
        } catch (err) {
            console.error('Upload failed:', err)
        }
    }, [editor, upload, onSuccess, handleClose])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full sm:max-w-md sm:h-[90vh] bg-black sm:rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">

                    {/* Camera Mode */}
                    {editor.mode === 'camera' && (
                        <CameraCapture onClose={handleClose} onCapture={editor.handleCapture} onGalleryUpload={editor.handleGalleryUpload} />
                    )}

                    {/* Editor Mode */}
                    {editor.mode === 'editor' && editor.mediaPreview && (
                        <div className="relative w-full h-full flex flex-col">
                            {/* Preview */}
                            <div className="flex-1 relative overflow-hidden">
                                {editor.mediaType === 'image' ? (
                                    <img src={editor.mediaPreview} alt="Preview" className="w-full h-full object-cover" style={{ filter: editor.activeFilter }} />
                                ) : (
                                    <video ref={editor.videoRef} src={editor.mediaPreview} className="w-full h-full object-cover" style={{ filter: editor.activeFilter }} loop autoPlay muted playsInline />
                                )}

                                {/* Overlays */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {editor.textOverlays.map(t => (
                                        <DraggableOverlay
                                            key={t.id}
                                            x={t.x}
                                            y={t.y}
                                            scale={t.scale}
                                            rotation={t.rotation}
                                            onDragEnd={(x, y) => editor.handleTextDrag(t.id, x, y)}
                                            onDelete={() => editor.handleDeleteText(t.id)}
                                        >
                                            <span className={`font-bold text-3xl ${t.font}`} style={{ color: t.color, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{t.text}</span>
                                        </DraggableOverlay>
                                    ))}
                                    {editor.stickers.map(s => {
                                        const Icon = STICKER_ICONS[s.type]
                                        // Parse display text (handle JSON for location stickers)
                                        let displayText = s.data
                                        if (s.type === 'location') {
                                            try {
                                                const parsed = JSON.parse(s.data)
                                                displayText = parsed.name || s.data
                                            } catch {
                                                displayText = s.data
                                            }
                                        }
                                        return (
                                            <DraggableOverlay
                                                key={s.id}
                                                x={s.x}
                                                y={s.y}
                                                scale={s.scale}
                                                rotation={s.rotation}
                                                onDragEnd={(x, y) => editor.handleStickerDrag(s.id, x, y)}
                                                onDelete={() => editor.handleDeleteSticker(s.id)}
                                            >
                                                <div className="bg-white/95 backdrop-blur-sm text-black px-4 py-2 rounded-xl shadow-xl font-bold flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${STICKER_COLORS[s.type]}`} />
                                                    {displayText}
                                                </div>
                                            </DraggableOverlay>
                                        )
                                    })}
                                </div>

                                {/* Top Toolbar */}
                                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent"
                                    style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 1rem)` }}>
                                    <button onClick={() => editor.setMode('camera')} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <div className="flex gap-3">
                                        <button onClick={() => editor.setIsTextEditorOpen(true)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40">
                                            <Type className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => editor.setIsStickerDrawerOpen(true)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40">
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Upload Progress */}
                                {isUploading && (
                                    <div className="absolute bottom-20 left-4 right-4 z-30">
                                        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4">
                                            <div className="text-white text-sm mb-2">{progress.message}</div>
                                            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress.progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Controls */}
                            <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 rounded-t-3xl z-30"
                                style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1rem)` }}>
                                <FilterBar activeFilter={editor.activeFilter} mediaPreview={editor.mediaPreview} onFilterChange={editor.setActiveFilter} />
                                <div className="flex items-center gap-3">
                                    {/* Schedule Button */}
                                    <button onClick={() => editor.setIsScheduleDrawerOpen(true)}
                                        className={`min-w-[48px] min-h-[48px] rounded-full border border-white/20 flex items-center justify-center touch-manipulation
                                            ${editor.scheduledTime ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-zinc-400'}`}>
                                        <Clock className="w-5 h-5" />
                                    </button>

                                    {/* Share to Story Button */}
                                    <button
                                        onClick={() => handlePost('public')}
                                        disabled={isUploading}
                                        className="flex-1 min-h-[48px] py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 
                                            bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 touch-manipulation"
                                    >
                                        {editor.scheduledTime ? 'Schedule' : 'Share'}
                                        <Send className="w-4 h-4" />
                                    </button>

                                    {/* Close Friends Button */}
                                    <button
                                        onClick={() => handlePost('close_friends')}
                                        disabled={isUploading}
                                        className="min-h-[48px] px-4 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 
                                            bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 touch-manipulation"
                                    >
                                        <Users className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Modals */}
                            <TextEditor isOpen={editor.isTextEditorOpen} onClose={() => editor.setIsTextEditorOpen(false)} onAdd={editor.handleAddText} />
                            <StickerDrawer
                                isOpen={editor.isStickerDrawerOpen}
                                onClose={() => editor.setIsStickerDrawerOpen(false)}
                                onAdd={editor.handleAddSticker}
                                onOpenLocationPicker={() => editor.setIsLocationPickerOpen(true)}
                                onOpenMentionPicker={() => editor.setIsMentionPickerOpen(true)}
                                onOpenPollCreator={() => editor.setIsPollCreatorOpen(true)}
                            />
                            <ScheduleDrawer isOpen={editor.isScheduleDrawerOpen} currentTime={editor.scheduledTime} onClose={() => editor.setIsScheduleDrawerOpen(false)} onConfirm={editor.setScheduledTime} />

                            {/* Interactive Sticker Pickers */}
                            <LocationPicker
                                isOpen={editor.isLocationPickerOpen}
                                onClose={() => editor.setIsLocationPickerOpen(false)}
                                onSelect={(location) => {
                                    // Serialize LocationData to JSON for storage
                                    const locationData = JSON.stringify({
                                        name: location.name,
                                        displayName: location.displayName,
                                        placeId: location.placeId,
                                        lat: location.lat,
                                        lng: location.lng,
                                        type: location.type
                                    })
                                    editor.handleAddSticker({ type: 'location', x: 0, y: 0, data: locationData })
                                    editor.setIsLocationPickerOpen(false)
                                }}
                            />
                            <MentionPicker
                                isOpen={editor.isMentionPickerOpen}
                                onClose={() => editor.setIsMentionPickerOpen(false)}
                                onSelect={(username) => {
                                    editor.handleAddSticker({ type: 'mention', x: 0, y: 0, data: username })
                                    editor.setIsMentionPickerOpen(false)
                                }}
                            />
                            <PollCreator
                                isOpen={editor.isPollCreatorOpen}
                                onClose={() => editor.setIsPollCreatorOpen(false)}
                                onSubmit={(question, options) => {
                                    editor.handleAddSticker({ type: 'poll', x: 0, y: 0, data: `${question}|${options.join('|')}` })
                                    editor.setIsPollCreatorOpen(false)
                                }}
                            />
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
})
