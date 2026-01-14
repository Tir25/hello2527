/**
 * GroupInfoPanel Component
 * 
 * Displays group details and member list.
 * Features: Bottom sheet (mobile), sliding panel (desktop), member management.
 * 
 * @module components/chat/GroupInfoPanel
 */

import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import { useIsMobileUI } from '@/hooks/useIsMobileUI'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddMemberModal } from './AddMemberModal'
import { MediaGalleryModal } from './gallery'
import {
    EditGroupModal,
    GroupInfoHeader,
    GroupInfoFooter,
    GroupInfoContent,
    useGroupInfoState,
} from './group'

interface GroupInfoPanelProps {
    isOpen: boolean
    onClose: () => void
    groupId: string
    groupName: string
    groupAvatar?: string | null
    groupDescription?: string | null
}

export const GroupInfoPanel = ({
    isOpen,
    onClose,
    groupId,
    groupName: initialGroupName,
    groupAvatar: initialGroupAvatar,
    groupDescription: initialGroupDescription,
}: GroupInfoPanelProps) => {
    const isMobile = useIsMobileUI()
    const dragControls = useDragControls()

    const state = useGroupInfoState({
        groupId,
        isOpen,
        initialGroupName,
        initialGroupAvatar,
        initialGroupDescription,
        onClose,
    })

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) onClose()
    }

    // Shared content props
    const contentProps = {
        groupId,
        groupName: state.groupName,
        groupAvatar: state.groupAvatar,
        groupDescription: state.groupDescription,
        members: state.members,
        filteredMembers: state.filteredMembers,
        loading: state.loading,
        refreshing: state.refreshing,
        error: state.error,
        isAdmin: state.isAdmin,
        isMobile,
        user: state.user,
        mutedUntil: state.mutedUntil,
        removingUserId: state.removingUserId,
        updatingRoleUserId: state.updatingRoleUserId,
        memberSearchQuery: state.memberSearchQuery,
        onMuteChange: state.setMutedUntil,
        onMediaGalleryClick: () => state.setShowMediaGallery(true),
        onSearch: state.setMemberSearchQuery,
        onRefresh: () => state.fetchMembers(true),
        onAddMemberClick: state.handleAddMemberClick,
        onRemoveMember: state.handleRemoveMember,
        onToggleRole: state.handleToggleRole,
        onAvatarChange: state.handleAvatarChange,
    }

    // Shared header/footer
    const header = (
        <div className="flex-shrink-0">
            <GroupInfoHeader isAdmin={state.isAdmin} onEditClick={() => state.setShowEditModal(true)} onClose={onClose} />
        </div>
    )

    const footer = (
        <div className="flex-shrink-0">
            <GroupInfoFooter
                groupId={groupId} groupName={state.groupName} isCreator={state.isCreator}
                isMobile={isMobile} leaving={state.leaving} onLeaveGroup={state.handleLeaveGroup} onDeleted={onClose}
            />
        </div>
    )

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={onClose}
                        />

                        {isMobile ? (
                            <motion.div
                                className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
                                style={{ height: '85dvh', maxHeight: '85dvh' }}
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                drag="y" dragControls={dragControls} dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={{ top: 0, bottom: 0.5 }} onDragEnd={handleDragEnd}
                            >
                                <div className="flex-shrink-0 flex justify-center py-3 cursor-grab active:cursor-grabbing bg-white rounded-t-3xl"
                                    onPointerDown={(e) => dragControls.start(e)}>
                                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                                </div>
                                {header}
                                <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                                    <GroupInfoContent {...contentProps} />
                                </div>
                                {footer}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white/95 backdrop-blur-xl 
                                           shadow-2xl z-50 border-l border-gray-200/50 flex flex-col"
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            >
                                {header}
                                <div className="flex-1 overflow-y-auto min-h-0">
                                    <GroupInfoContent {...contentProps} />
                                </div>
                                {footer}
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>

            <AddMemberModal isOpen={state.showAddMember} onClose={() => state.setShowAddMember(false)}
                groupId={groupId} groupName={state.groupName} existingMemberIds={state.members.map(m => m.user_id)}
                onMemberAdded={() => state.fetchMembers(true)} />

            <EditGroupModal isOpen={state.showEditModal} onClose={() => state.setShowEditModal(false)}
                groupId={groupId} currentName={state.groupName} currentDescription={state.groupDescription ?? null}
                onUpdate={state.handleGroupUpdate} />

            <MediaGalleryModal isOpen={state.showMediaGallery} onClose={() => state.setShowMediaGallery(false)}
                conversationId={groupId} conversationName={state.groupName} isGroup={true} />

            <ConfirmDialog isOpen={state.confirmDialog.isOpen} title={state.confirmDialog.title}
                message={state.confirmDialog.message} variant={state.confirmDialog.variant}
                confirmLabel="Confirm" cancelLabel="Cancel"
                onConfirm={state.confirmDialog.onConfirm} onCancel={state.closeConfirmDialog} />
        </>
    )
}
