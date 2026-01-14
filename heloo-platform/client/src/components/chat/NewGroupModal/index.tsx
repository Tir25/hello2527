/**
 * NewGroupModal Component
 * 
 * Modal for creating a new group chat.
 * Features:
 * - Full-screen bottom sheet on mobile (swipe to dismiss via handle)
 * - Centered modal on desktop
 * - Group name input with character counter
 * - Multi-select user picker (friends only)
 * - Larger touch targets on mobile (56px rows)
 * - Haptic feedback on actions
 */

import { useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Search } from 'lucide-react'
import { useIsMobileUI } from '@/hooks/useIsMobileUI'
import { useNewGroupModal } from './useNewGroupModal'
import { ModalHeader } from './ModalHeader'
import { ModalFooter } from './ModalFooter'
import { SelectedMembersPills } from './SelectedMembersPills'
import { ContactsList } from './ContactsList'
import { ErrorMessage } from './ErrorMessage'

interface NewGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onGroupCreated?: (groupId: string) => void
}

export const NewGroupModal = ({ isOpen, onClose, onGroupCreated }: NewGroupModalProps) => {
    const isMobile = useIsMobileUI()
    const groupNameInputRef = useRef<HTMLInputElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const {
        groupName,
        setGroupName,
        searchQuery,
        setSearchQuery,
        selectedMembers,
        selectedMemberIds,
        isCreating,
        error,
        contacts,
        filteredContacts,
        contactsLoading,
        toggleMember,
        handleClose,
        handleCreateGroup,
    } = useNewGroupModal({ isOpen, onClose, onGroupCreated })

    // Handle drag end for mobile bottom sheet (only on handle)
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            handleClose()
        }
    }

    const isCreateDisabled = !groupName.trim() || selectedMembers.length === 0

    const modalContent = (
        <>
            <ModalHeader onClose={handleClose} />

            {/* Body - Scrollable */}
            <div className={`p-4 space-y-4 overflow-y-auto ${isMobile ? 'flex-1' : 'max-h-[60vh]'}`}>
                {/* Group Name Input */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label htmlFor="group-name-input" className="block text-sm font-medium text-gray-700">
                            Group Name
                        </label>
                        <span className="text-xs text-gray-400">{groupName.length}/50</span>
                    </div>
                    <input
                        ref={groupNameInputRef}
                        id="group-name-input"
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Enter group name..."
                        className="w-full px-4 py-3.5 rounded-xl bg-gray-100/80 border border-gray-200/50
                       text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-purple-400 focus:border-transparent transition-all
                       text-base"
                        maxLength={50}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="words"
                    />
                </div>

                <SelectedMembersPills members={selectedMembers} onRemove={toggleMember} />

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-100/80 border border-gray-200/50
                       text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-purple-400 focus:border-transparent transition-all
                       text-base"
                        autoComplete="off"
                        autoCorrect="off"
                    />
                </div>

                <ContactsList
                    contacts={contacts}
                    filteredContacts={filteredContacts}
                    isLoading={contactsLoading}
                    selectedMemberIds={selectedMemberIds}
                    onToggleMember={toggleMember}
                />

                <ErrorMessage error={error} />
            </div>

            <ModalFooter
                isMobile={isMobile}
                isCreating={isCreating}
                isDisabled={isCreateDisabled}
                memberCount={selectedMembers.length}
                onCreateGroup={handleCreateGroup}
            />
        </>
    )

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    {isMobile ? (
                        /* Mobile: Full-screen bottom sheet */
                        <motion.div
                            className="fixed inset-x-0 bottom-0 top-0 z-50 flex flex-col bg-white
                         rounded-t-3xl overflow-hidden"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        >
                            {/* Drag handle - ONLY this element is draggable */}
                            <motion.div
                                className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={{ top: 0, bottom: 0.8 }}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="w-10 h-1 rounded-full bg-gray-300" />
                            </motion.div>
                            {modalContent}
                        </motion.div>
                    ) : (
                        /* Desktop: Centered modal */
                        <motion.div
                            className="fixed inset-x-4 top-1/2 max-w-md mx-auto z-50 
                         bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden
                         border border-gray-200/50 flex flex-col"
                            initial={{ opacity: 0, scale: 0.95, y: '-45%' }}
                            animate={{ opacity: 1, scale: 1, y: '-50%' }}
                            exit={{ opacity: 0, scale: 0.95, y: '-45%' }}
                        >
                            {modalContent}
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    )
}
