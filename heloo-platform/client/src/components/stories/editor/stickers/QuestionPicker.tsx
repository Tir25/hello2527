/**
 * Question Picker Component
 * Modal for creating Q&A stickers with custom question text
 *
 * @module components/stories/editor/stickers/QuestionPicker
 */

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'

interface QuestionPickerProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (question: string) => void
}

/**
 * Question picker modal with text input and preview
 */
export const QuestionPicker = memo(function QuestionPicker({
    isOpen,
    onClose,
    onConfirm
}: QuestionPickerProps) {
    const [question, setQuestion] = useState('')

    const handleSubmit = useCallback(() => {
        const questionText = question.trim() || 'Ask me anything'
        onConfirm(questionText)
        setQuestion('')
        onClose()
    }, [question, onConfirm, onClose])

    const handleClose = useCallback(() => {
        setQuestion('')
        onClose()
    }, [onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col"
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-4 border-b border-white/10"
                        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
                    >
                        <button
                            onClick={handleClose}
                            className="min-w-[60px] min-h-[44px] flex items-center justify-start text-zinc-400 font-medium touch-manipulation"
                        >
                            Cancel
                        </button>
                        <h2 className="text-white font-bold text-lg">Question</h2>
                        <button
                            onClick={handleSubmit}
                            className="min-w-[60px] min-h-[44px] flex items-center justify-end text-purple-500 font-bold touch-manipulation"
                        >
                            Done
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Question Input */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Your Question
                            </label>
                            <textarea
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl
                                    placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-purple-500
                                    resize-none min-h-[100px]"
                                maxLength={150}
                            />
                            <p className="text-zinc-500 text-xs mt-1 text-right">
                                {question.length}/150
                            </p>
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Preview
                            </label>
                            <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl p-4 border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <HelpCircle className="w-5 h-5 text-purple-500" />
                                    <span className="text-white font-bold">
                                        {question || 'Ask me anything'}
                                    </span>
                                </div>
                                <div className="bg-white/10 rounded-lg px-4 py-3 text-zinc-400 text-sm">
                                    Type your response...
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
