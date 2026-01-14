/**
 * Reply Input Component
 * Text input for story replies
 * 
 * @module components/stories/viewer/ReplyInput
 */

import { memo, useState, useCallback } from 'react'
import { Heart, Send } from 'lucide-react'

interface ReplyInputProps {
    onSend: (message: string) => void
    onLike: () => void
}

/**
 * Input field for replying to stories
 */
export const ReplyInput = memo(function ReplyInput({
    onSend,
    onLike
}: ReplyInputProps) {
    const [message, setMessage] = useState('')

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return
        onSend(message.trim())
        setMessage('')
    }, [message, onSend])

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Send a message..."
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-3 px-5 text-white placeholder:text-white/60 outline-none focus:bg-black/40 transition-colors"
                />
            </div>
            <button
                type="button"
                onClick={onLike}
                className="text-white hover:scale-110 transition-transform"
            >
                <Heart size={28} />
            </button>
            <button
                type="submit"
                className="text-white hover:scale-110 transition-transform -rotate-12"
            >
                <Send size={26} />
            </button>
        </form>
    )
})
