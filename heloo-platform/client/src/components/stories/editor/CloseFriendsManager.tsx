/**
 * Close Friends Manager Component
 * Allows users to add/remove close friends
 *
 * @module components/stories/editor/CloseFriendsManager
 */

import { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, Users, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CloseFriendsManagerProps {
    isOpen: boolean
    onClose: () => void
}

interface FriendOption {
    id: string
    username: string
    avatar_url: string | null
    isCloseFriend: boolean
}

/**
 * Modal for managing close friends list
 */
export const CloseFriendsManager = memo(function CloseFriendsManager({
    isOpen,
    onClose
}: CloseFriendsManagerProps) {
    const [search, setSearch] = useState('')
    const [friends, setFriends] = useState<FriendOption[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState<string | null>(null)

    // Fetch both followers AND following users (from relationships table) with close friend status
    useEffect(() => {
        if (!isOpen) return

        const fetchFriends = async () => {
            setIsLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Get people the user follows (where user is requester and status is accepted)
                const { data: following } = await supabase
                    .from('relationships')
                    .select('recipient_id')
                    .eq('requester_id', user.id)
                    .eq('status', 'accepted')

                // Get people who follow the user (where user is recipient and status is accepted)
                const { data: followers } = await supabase
                    .from('relationships')
                    .select('requester_id')
                    .eq('recipient_id', user.id)
                    .eq('status', 'accepted')

                // Get current close friends
                const { data: closeFriends } = await supabase
                    .from('close_friends')
                    .select('friend_id')
                    .eq('user_id', user.id)

                const closeFriendIds = new Set(closeFriends?.map(cf => cf.friend_id) || [])

                // Combine following and followers IDs (deduplicate)
                const followingIds = following?.map(f => f.recipient_id).filter(Boolean) || []
                const followerIds = followers?.map(f => f.requester_id).filter(Boolean) || []
                const allUserIds = [...new Set([...followingIds, ...followerIds])]

                // Fetch profiles for all users
                if (allUserIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, username, avatar_url')
                        .in('id', allUserIds)

                    setFriends(profiles?.map(p => ({
                        ...p,
                        isCloseFriend: closeFriendIds.has(p.id)
                    })) || [])
                } else {
                    setFriends([])
                }
            } catch (error) {
                console.error('Failed to fetch friends:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFriends()
    }, [isOpen])

    const toggleCloseFriend = useCallback(async (friendId: string, isCurrentlyClose: boolean) => {
        setIsSaving(friendId)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            if (isCurrentlyClose) {
                // Remove from close friends
                await supabase
                    .from('close_friends')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('friend_id', friendId)
            } else {
                // Add to close friends
                await supabase
                    .from('close_friends')
                    .insert({ user_id: user.id, friend_id: friendId })
            }

            // Update local state
            setFriends(prev => prev.map(f =>
                f.id === friendId ? { ...f, isCloseFriend: !isCurrentlyClose } : f
            ))
        } catch (error) {
            console.error('Failed to toggle close friend:', error)
        } finally {
            setIsSaving(null)
        }
    }, [])

    const filteredFriends = friends.filter(f =>
        f.username.toLowerCase().includes(search.toLowerCase())
    )

    const closeFriendsCount = friends.filter(f => f.isCloseFriend).length

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-zinc-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold">Close Friends</h2>
                                <p className="text-zinc-500 text-xs">{closeFriendsCount} selected</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors touch-manipulation"
                        >
                            <X className="w-6 h-6 text-zinc-400" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search followers..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4
                                    text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 
                                    focus:ring-green-500/50"
                            />
                        </div>
                    </div>

                    {/* Friends List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                            </div>
                        ) : filteredFriends.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-zinc-500 text-sm">
                                    {friends.length === 0 ? 'No connections yet - Follow people or get followers to add them' : 'No matches found'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredFriends.map(friend => (
                                    <button
                                        key={friend.id}
                                        onClick={() => toggleCloseFriend(friend.id, friend.isCloseFriend)}
                                        disabled={isSaving === friend.id}
                                        className="w-full flex items-center gap-3 p-4 min-h-[64px] rounded-xl hover:bg-white/5 
                                            transition-colors disabled:opacity-50 touch-manipulation"
                                    >
                                        <img
                                            src={friend.avatar_url || '/default-avatar.svg'}
                                            alt={friend.username}
                                            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                                        />
                                        <span className="flex-1 text-white text-left font-medium min-w-0 truncate">
                                            {friend.username}
                                        </span>
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                            transition-all ${friend.isCloseFriend
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-zinc-600'
                                            }`}>
                                            {isSaving === friend.id ? (
                                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                                            ) : friend.isCloseFriend && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10">
                        <p className="text-zinc-500 text-xs text-center">
                            Only close friends can see your Close Friends stories
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
})
