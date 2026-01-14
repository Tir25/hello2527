/**
 * AddMemberModal Component
 * 
 * Modal to add members to a group.
 * Shows contacts that are not already in the group.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, UserPlus, Loader2, Check } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { groupService } from '@/lib/services/group.service'
import { toast } from '@/store/toastStore'
import { logger } from '@/lib/logger'
import { cn } from '@/utils/cn'
import { useIsMobileUI } from '@/hooks/useIsMobileUI'

interface AddMemberModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string
    groupName: string
    existingMemberIds: string[]
    onMemberAdded: () => void
}

export const AddMemberModal = ({
    isOpen,
    onClose,
    groupId,
    groupName,
    existingMemberIds,
    onMemberAdded,
}: AddMemberModalProps) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [isAdding, setIsAdding] = useState(false)

    const contacts = useChatStore(state => state.contacts)
    const isMobile = useIsMobileUI()

    // Filter contacts that are not already members
    const availableContacts = contacts.filter(
        contact => !existingMemberIds.includes(contact.id)
    )

    // Filter by search query
    const filteredContacts = availableContacts.filter(contact => {
        const query = searchQuery.toLowerCase()
        return (
            contact.full_name?.toLowerCase().includes(query) ||
            contact.username?.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query)
        )
    })

    // Reset selection when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedUserIds([])
            setSearchQuery('')
        }
    }, [isOpen])

    const toggleSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleAddMembers = async () => {
        if (selectedUserIds.length === 0) {
            toast.error('Please select at least one contact')
            return
        }

        setIsAdding(true)

        let successCount = 0
        let failCount = 0

        for (const userId of selectedUserIds) {
            const result = await groupService.addMember(groupId, userId)
            if (result.success) {
                successCount++
            } else {
                failCount++
                logger.error('AddMemberModal', `Failed to add member ${userId}: ${result.error}`)
            }
        }

        setIsAdding(false)

        if (successCount > 0) {
            toast.success(`Added ${successCount} member${successCount > 1 ? 's' : ''} to ${groupName}`)
            onMemberAdded()
            onClose()
        }

        if (failCount > 0) {
            toast.error(`Failed to add ${failCount} member${failCount > 1 ? 's' : ''}`)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Add Members</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search contacts..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-900
                                         placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Contact List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {availableContacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>All your contacts are already in this group</p>
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No contacts match your search</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredContacts.map(contact => {
                                    const isSelected = selectedUserIds.includes(contact.id)
                                    return (
                                        <button
                                            key={contact.id}
                                            onClick={() => toggleSelection(contact.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                                                isSelected
                                                    ? "bg-purple-50 border-2 border-purple-500"
                                                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                                            )}
                                        >
                                            {/* Avatar */}
                                            {contact.avatar_url ? (
                                                <img
                                                    src={contact.avatar_url}
                                                    alt={contact.full_name || 'User'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400
                                                              flex items-center justify-center text-white font-semibold">
                                                    {(contact.full_name || contact.username || '?')[0].toUpperCase()}
                                                </div>
                                            )}

                                            {/* Name */}
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-gray-900">
                                                    {contact.full_name || contact.username || 'Unknown'}
                                                </p>
                                                {contact.username && (
                                                    <p className="text-sm text-gray-500">@{contact.username}</p>
                                                )}
                                            </div>

                                            {/* Selection indicator */}
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                                isSelected
                                                    ? "bg-purple-500 text-white"
                                                    : "bg-gray-200"
                                            )}>
                                                {isSelected && <Check className="w-4 h-4" />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        "p-4 border-t border-gray-100 flex-shrink-0",
                        isMobile && "pb-safe-min"
                    )}>
                        <button
                            onClick={handleAddMembers}
                            disabled={selectedUserIds.length === 0 || isAdding}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white
                                     font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                                     hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {isAdding ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} member${selectedUserIds.length > 1 ? 's' : ''}` : 'Members'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
