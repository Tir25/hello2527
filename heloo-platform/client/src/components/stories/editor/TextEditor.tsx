/**
 * Text Editor Modal
 * Add text overlays with fonts and colors
 *
 * @module components/stories/editor/TextEditor
 */

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TEXT_COLORS, TEXT_FONTS } from '@/constants/storyConstants'

interface TextEditorProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (text: string, color: string, font: string) => void
}

/**
 * Full-screen text editor overlay
 */
export const TextEditor = memo(function TextEditor({
    isOpen,
    onClose,
    onAdd
}: TextEditorProps) {
    const [text, setText] = useState('')
    const [color, setColor] = useState('#ffffff')
    const [fontIndex, setFontIndex] = useState(0)

    const selectedFont = TEXT_FONTS[fontIndex]

    const handleDone = useCallback(() => {
        if (!text.trim()) {
            onClose()
            return
        }
        onAdd(text.trim(), color, selectedFont.class)
        setText('')
        onClose()
    }, [text, color, selectedFont, onAdd, onClose])

    const handleCancel = useCallback(() => {
        setText('')
        onClose()
    }, [onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col"
                >
                    {/* Header */}
                    <div
                        className="flex justify-between items-center p-4"
                        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
                    >
                        <button
                            onClick={handleCancel}
                            className="min-h-[44px] px-4 text-white font-medium hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDone}
                            className="min-h-[44px] px-5 text-white font-bold bg-blue-500 rounded-full hover:bg-blue-600 transition-colors touch-manipulation"
                        >
                            Done
                        </button>
                    </div>

                    {/* Text Input */}
                    <div className="flex-1 flex items-center justify-center px-6">
                        <textarea
                            autoFocus
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type something..."
                            className={`w-full bg-transparent text-center text-3xl placeholder:text-white/30 outline-none resize-none ${selectedFont.class}`}
                            style={{ color }}
                            rows={3}
                        />
                    </div>

                    {/* Controls */}
                    <div className="p-4 space-y-4 bg-black/40">
                        {/* Font Selector - Scrollable */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x -webkit-overflow-scrolling-touch">
                            {TEXT_FONTS.map((f, i) => (
                                <button
                                    key={f.name}
                                    onClick={() => setFontIndex(i)}
                                    className={`min-h-[44px] px-5 py-2.5 rounded-full text-sm border whitespace-nowrap snap-center
                                        transition-all flex-shrink-0 touch-manipulation ${fontIndex === i
                                            ? 'bg-white text-black border-white'
                                            : 'text-white border-white/30 hover:border-white/60'
                                        }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>

                        {/* Color Picker - Scrollable */}
                        <div
                            className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x -webkit-overflow-scrolling-touch"
                            style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))' }}
                        >
                            {TEXT_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-11 h-11 rounded-full border-2 flex-shrink-0 snap-center touch-manipulation
                                        transition-transform ${color === c
                                            ? 'border-white scale-110'
                                            : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: c }}
                                    aria-label={`Select color ${c}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
