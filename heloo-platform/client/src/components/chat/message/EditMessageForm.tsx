/**
 * Edit Message Form
 * 
 * Responsibility: Inline message editing UI
 * Layer: UI Component (Presenter)
 * 
 * Extracted from MessageBubble.tsx for modularity.
 */

interface EditMessageFormProps {
    editContent: string
    isLoading: boolean
    onContentChange: (content: string) => void
    onSave: () => void
    onCancel: () => void
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export const EditMessageForm = ({
    editContent,
    isLoading,
    onContentChange,
    onSave,
    onCancel,
    onKeyDown,
}: EditMessageFormProps) => {
    return (
        <div className="space-y-3">
            <textarea
                value={editContent}
                onChange={(e) => onContentChange(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full min-h-[80px] p-3 text-base sm:text-sm bg-white/20 rounded-xl border border-white/30 
                    focus:outline-none focus:ring-2 focus:ring-white/50 resize-none
                    text-white placeholder-white/50"
                placeholder="Edit message..."
                autoFocus
                disabled={isLoading}
            />
            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="min-h-[44px] px-4 py-2 text-sm rounded-full bg-white/20 hover:bg-white/30 
                        transition-colors disabled:opacity-50 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    disabled={isLoading || !editContent.trim()}
                    className="min-h-[44px] px-5 py-2 text-sm rounded-full bg-white/40 hover:bg-white/50 
                        transition-colors disabled:opacity-50 font-semibold"
                >
                    {isLoading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    )
}
