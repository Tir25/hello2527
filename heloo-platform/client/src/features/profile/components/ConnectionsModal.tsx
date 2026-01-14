/**
 * ConnectionsModal Component
 * 
 * Display followers/following list in a modal with search.
 * @module features/profile/components/ConnectionsModal
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Users, UserPlus, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { connectionsService, type ConnectionUser } from '../services/connections.service'
import { ConnectionTabButton } from './ConnectionTabButton'
import { ConnectionUserRow } from './ConnectionUserRow'

type TabType = 'followers' | 'following'

interface ConnectionsModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    initialTab?: TabType
    followersCount: number
    followingCount: number
}

export const ConnectionsModal = ({
    isOpen,
    onClose,
    userId,
    initialTab = 'followers',
    followersCount,
    followingCount,
}: ConnectionsModalProps) => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)
    const [searchQuery, setSearchQuery] = useState('')
    const [users, setUsers] = useState<ConnectionUser[]>([])
    const [loading, setLoading] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const modalRef = useRef<HTMLDivElement>(null)

    // Focus trap for accessibility
    useFocusTrap(modalRef, { isActive: isOpen, initialFocusRef: searchInputRef })

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab)
            setSearchQuery('')
            searchInputRef.current?.focus()
        }
    }, [isOpen, initialTab])

    // Fetch users with debounce
    const fetchUsers = useCallback(async (search: string) => {
        setLoading(true)
        const service = activeTab === 'followers' ? connectionsService.getFollowers : connectionsService.getFollowing
        const result = await service(userId, search || undefined)
        if (result.success && result.data) setUsers(result.data)
        setLoading(false)
    }, [userId, activeTab])

    // Fetch on tab/search change
    useEffect(() => {
        if (!isOpen) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchUsers(searchQuery), 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [isOpen, activeTab, searchQuery, fetchUsers])

    // Handle user click
    const handleUserClick = (user: ConnectionUser) => {
        onClose()
        navigate(`/profile/${user.username || user.id}`)
    }

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            return () => document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-[10%] bottom-[10%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                role="dialog" aria-modal="true" aria-labelledby="connections-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 id="connections-modal-title" className="text-lg font-semibold text-gray-800">Connections</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div role="tablist" aria-label="Connection tabs" className="flex border-b border-gray-100">
                    <ConnectionTabButton active={activeTab === 'followers'} onClick={() => setActiveTab('followers')}
                        icon={<Users size={16} />} label="Followers" count={followersCount} />
                    <ConnectionTabButton active={activeTab === 'following'} onClick={() => setActiveTab('following')}
                        icon={<UserPlus size={16} />} label="Following" count={followingCount} />
                </div>

                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border-0 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all text-sm"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-purple-500" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Users size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">
                                {searchQuery ? 'No users found' : activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <ConnectionUserRow key={user.id} user={user} onClick={() => handleUserClick(user)} />
                            ))}
                        </ul>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
