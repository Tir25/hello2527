/**
 * Poll Creator Component
 * Create interactive poll stickers for stories
 *
 * @module components/stories/editor/stickers/PollCreator
 */

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'

interface PollCreatorProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (question: string, options: string[]) => void
}

const MAX_OPTIONS = 4
const MIN_OPTIONS = 2

/**
 * Poll creation modal with customizable options
 */
export const PollCreator = memo(function PollCreator({
    isOpen,
    onClose,
    onSubmit
}: PollCreatorProps) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['Yes', 'No'])

    const handleAddOption = useCallback(() => {
        if (options.length < MAX_OPTIONS) {
            setOptions(prev => [...prev, ''])
        }
    }, [options.length])

    const handleRemoveOption = useCallback((index: number) => {
        if (options.length > MIN_OPTIONS) {
            setOptions(prev => prev.filter((_, i) => i !== index))
        }
    }, [options.length])

    const handleOptionChange = useCallback((index: number, value: string) => {
        setOptions(prev => prev.map((opt, i) => (i === index ? value : opt)))
    }, [])

    const handleSubmit = useCallback(() => {
        const pollQuestion = question.trim() || 'Vote!'
        const pollOptions = options.filter(o => o.trim()).length >= 2
            ? options.filter(o => o.trim())
            : ['Yes', 'No']

        onSubmit(pollQuestion, pollOptions)
        setQuestion('')
        setOptions(['Yes', 'No'])
        onClose()
    }, [question, options, onSubmit, onClose])

    const handleClose = useCallback(() => {
        setQuestion('')
        setOptions(['Yes', 'No'])
        onClose()
    }, [onClose])

    const isValid = options.filter(o => o.trim()).length >= MIN_OPTIONS

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
                        <h2 className="text-white font-bold text-lg">Create Poll</h2>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid}
                            className="min-w-[60px] min-h-[44px] flex items-center justify-end text-blue-500 font-bold disabled:opacity-50 touch-manipulation"
                        >
                            Done
                        </button>
                    </div>

                    {/* Poll Form */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Question */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Question (optional)
                            </label>
                            <input
                                type="text"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="Ask a question..."
                                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl
                                    placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={100}
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Options
                            </label>
                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={e => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-xl
                                                placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-green-500"
                                            maxLength={30}
                                        />
                                        {options.length > MIN_OPTIONS && (
                                            <button
                                                onClick={() => handleRemoveOption(index)}
                                                className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-zinc-800 rounded-xl text-red-500 hover:bg-red-500/20 transition-colors touch-manipulation"
                                                aria-label="Remove option"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Option Button */}
                            {options.length < MAX_OPTIONS && (
                                <button
                                    onClick={handleAddOption}
                                    className="w-full mt-3 flex items-center justify-center gap-2 min-h-[48px] py-3 
                                        bg-zinc-800/50 border border-dashed border-zinc-700 rounded-xl
                                        text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors touch-manipulation"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Option
                                </button>
                            )}
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="text-zinc-500 text-xs uppercase mb-2 block font-medium">
                                Preview
                            </label>
                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                                <p className="text-white font-bold text-center mb-3">
                                    {question || 'Vote!'}
                                </p>
                                <div className="space-y-2">
                                    {options.filter(o => o.trim()).map((opt, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/10 rounded-lg py-2 px-4 text-center text-white text-sm"
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
