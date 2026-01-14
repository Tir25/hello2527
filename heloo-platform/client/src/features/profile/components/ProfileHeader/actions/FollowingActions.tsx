/**
 * FollowingActions Component
 * 
 * Shows: Message + Following badge + More menu (Unfollow/Block)
 * Used when: Current user follows the profile
 */

import { motion } from 'framer-motion'
import { MessageCircle, UserCheck, MoreVertical, UserMinus, Lock } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { FollowingActionsProps } from './types'

export const FollowingActions = ({
    profile,
    loading,
    showMenu,
    menuRef,
    buttonRef,
    firstMenuItemRef,
    onSetShowMenu,
    onMessage,
    onShowUnfollowConfirm,
    onShowBlockConfirm,
}: FollowingActionsProps) => {
    const handleMenuKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onSetShowMenu(false)
            buttonRef.current?.focus()
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const items = menuRef.current?.querySelectorAll('[role="menuitem"]')
            if (!items || items.length === 0) return

            const currentIndex = Array.from(items).findIndex(
                (item) => item === document.activeElement
            )
            let nextIndex = 0

            if (e.key === 'ArrowDown') {
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
            } else {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
            }

            ; (items[nextIndex] as HTMLElement)?.focus()
        }
    }

    return (
        <div className="flex gap-3">
            <Button
                variant="primary"
                onClick={onMessage}
                className="flex-1 flex items-center justify-center gap-2"
                aria-label={`Message ${profile.full_name || profile.username || 'user'}`}
            >
                <MessageCircle size={18} />
                Message
            </Button>

            {/* Following Badge */}
            <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                <UserCheck size={16} />
                <span>Following</span>
            </div>

            {/* More Menu */}
            <div className="relative">
                <Button
                    ref={buttonRef}
                    variant="secondary"
                    onClick={() => onSetShowMenu(!showMenu)}
                    className="px-4"
                    aria-label="More options"
                    aria-expanded={showMenu}
                    aria-haspopup="true"
                >
                    <MoreVertical size={18} />
                </Button>

                {showMenu && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50"
                        role="menu"
                        onKeyDown={handleMenuKeyDown}
                    >
                        <button
                            key="unfollow"
                            ref={firstMenuItemRef}
                            type="button"
                            onClick={onShowUnfollowConfirm}
                            disabled={loading}
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            role="menuitem"
                            aria-label="Unfollow user"
                            tabIndex={0}
                        >
                            <UserMinus size={16} />
                            Unfollow
                        </button>
                        <button
                            key="block"
                            type="button"
                            onClick={onShowBlockConfirm}
                            disabled={loading}
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            role="menuitem"
                            aria-label="Block user"
                            tabIndex={0}
                        >
                            <Lock size={16} />
                            Block
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
