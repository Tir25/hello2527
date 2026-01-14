/**
 * Mention Picker Component
 * User search for @mention stickers
 *
 * @module components/stories/editor/stickers/MentionPicker
 */

import { memo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AtSign, Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MentionPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (username: string) => void
}

interface UserResult {
    id: string
    username: string
    avatar_url: string | null
}

/**
 * Mention picker modal with user search
 */
export const MentionPicker = memo(function MentionPicker({
    isOpen,
    onClose,
    onSelect
}: MentionPickerProps) {
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState<UserResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Search users when query changes
    useEffect(() => {
        if (!query.trim()) {
            setUsers([])
            return
        }

        const searchUsers = async () => {
            setIsSearching(true)
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .ilike('username', `%${query}%`)
                    .limit(10)

                if (!error && data) {
                    setUsers(data)
                }
            } catch (err) {
                console.error('User search failed:', err)
            } finally {
                setIsSearching(false)
            }
        }

        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleSelect = useCallback((username: string) => {
        onSelect(`@${username}`)
        setQuery('')
        onClose()
    }, [onSelect, onClose])

    const handleClose = useCallback(() => {
        setQuery('')
        setUsers([])
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
                        <h2 className="text-white font-bold text-lg">Mention Someone</h2>
                        <button
                            onClick={handleClose}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors touch-manipulation"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search users..."
                                className="w-full bg-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl
                                    placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        {!query && (
                            <p className="text-zinc-500 text-center py-8">
                                Search for a user to mention
                            </p>
                        )}
                        {query && users.length === 0 && !isSearching && (
                            <p className="text-zinc-500 text-center py-8">
                                No users found for "{query}"
                            </p>
                        )}
                        <div className="space-y-1">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelect(user.username)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl min-h-[56px]
                                        hover:bg-white/10 active:bg-white/20 transition-colors text-left group touch-manipulation"
                                >
                                    <div className="w-11 h-11 bg-blue-500/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <AtSign className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <span className="text-white group-hover:text-blue-400 transition-colors">
                                        @{user.username}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
