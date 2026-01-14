/**
 * UserItem Component
 * 
 * Conversation list item with swipe actions (Archive/Delete).
 * Context Menu removed in favor of Swipe Gestures and Header Profile access.
 * 
 * Responsibility: Compose sub-components and handle interactions
 * Layer: UI Component (Container)
 */

import { memo } from 'react'
import { motion, useReducedMotion, useAnimation, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/utils/cn'
import { useChatStore } from '@/store/chatStore'
import { useUserItemActions } from '@/hooks/sidebar/useUserItemActions'
import { UserItemContent } from './UserItemContent'
import type { Profile } from '@/lib/services/profile.service'
import type { ConversationProfile } from '@/lib/services/user.service'

interface UserItemProps {
    user: Profile | ConversationProfile
    isSelected: boolean
    onClick: () => void
    lastMessage?: string | null
    lastMessageTime?: string | null
    unreadCount?: number
    onArchiveChange?: () => void
}

const UserItemComponent = ({
    user,
    isSelected,
    onClick,
    lastMessage,
    lastMessageTime,
    unreadCount = 0,
    onArchiveChange,
}: UserItemProps) => {
    const { isUserOnline } = useChatStore()
    const prefersReducedMotion = useReducedMotion()

    // Swipe Animation
    const controls = useAnimation()
    const x = useMotionValue(0)
    const bgStyle = useTransform(x, [-100, 0, 100], [
        'rgba(239, 68, 68, 1)',   // Red (Delete)
        'rgba(255, 255, 255, 0)', // Transparent
        'rgba(168, 85, 247, 1)'   // Purple (Archive)
    ])

    const handleDragEnd = async (_: unknown, info: PanInfo) => {
        const offset = x.get()
        const velocity = info.velocity.x

        // Swipe Left (Delete)
        if (offset < -100 || (offset < -50 && velocity < -500)) {
            controls.start({ x: 0 }) // Snap back first
            handleDeleteClick()
        }
        // Swipe Right (Archive/Unarchive)
        else if (offset > 100 || (offset > 50 && velocity > 500)) {
            await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } })
            handleArchive()
        }
        // Snap back
        else {
            controls.start({ x: 0 })
        }
    }

    // Derived values
    const isArchived = 'is_archived' in user ? user.is_archived === true : false
    const displayName = ('name' in user && user.name) || user.full_name || user.username || user.email?.split('@')[0] || 'User'
    const subtitle = lastMessage || (user.status || "Hey there! I am using He'loo")
    const isOnline = isUserOnline(user.id)
    const isGroup = 'is_group' in user && user.is_group === true
    const memberCount = 'member_count' in user ? user.member_count : undefined

    // Actions hook
    const {
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleArchive,
        handleDeleteClick,
        handleDeleteConfirm,
    } = useUserItemActions({
        userId: user.id,
        isArchived,
        isSelected,
        onArchiveChange,
    })

    return (
        <div className="relative group touch-pan-y select-none">
            {/* Background Actions Layer */}
            <motion.div
                style={{ backgroundColor: bgStyle }}
                className="absolute inset-0 flex items-center justify-between px-6 rounded-xl z-0"
            >
                {/* Left (Archive Action) */}
                <div className="text-white">
                    {isArchived ? <ArchiveRestore size={24} /> : <Archive size={24} />}
                </div>
                {/* Right (Delete Action) */}
                <div className="text-white">
                    <Trash2 size={24} />
                </div>
            </motion.div>
            <motion.button
                type="button"
                onClick={onClick}
                // Drag props (Only X axis enabled)
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                style={{ x }}
                animate={controls}
                // Styling
                className={cn(
                    'w-full text-left flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:outline-none relative z-10',
                    'transition-shadow duration-150 min-h-[72px]',
                    isSelected
                        ? 'bg-white/90 shadow-lg border-2 border-purple-300/50 ring-2 ring-purple-200/30'
                        : 'bg-white border border-white/30 hover:bg-white/80 hover:shadow-md',
                    'focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2'
                )}
                whileHover={prefersReducedMotion ? undefined : { scale: isSelected ? 1.01 : 1.015 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.15 }}
                aria-pressed={isSelected}
            >
                <UserItemContent
                    user={user as Profile}
                    displayName={displayName}
                    subtitle={subtitle}
                    lastMessageTime={lastMessageTime}
                    unreadCount={unreadCount}
                    isOnline={isOnline}
                    isGroup={isGroup}
                    memberCount={memberCount}
                />
            </motion.button>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Chat"
                message="Are you sure you want to delete this chat? The chat history will be hidden, but you'll remain connected."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    )
}

export const UserItem = memo(UserItemComponent)
UserItem.displayName = 'UserItem'
