/**
 * NewGroupModal Footer
 * 
 * Footer with create group button.
 */

import { memo } from 'react'
import { Users, Loader2 } from 'lucide-react'

interface ModalFooterProps {
    isMobile: boolean
    isCreating: boolean
    isDisabled: boolean
    memberCount: number
    onCreateGroup: () => void
}

export const ModalFooter = memo(function ModalFooter({
    isMobile,
    isCreating,
    isDisabled,
    memberCount,
    onCreateGroup
}: ModalFooterProps) {
    return (
        <div className={`p-4 border-t border-gray-200/50 bg-gray-50/50 flex-shrink-0 ${isMobile ? 'pb-safe-min' : ''}`}>
            <button
                type="button"
                onClick={onCreateGroup}
                disabled={isCreating || isDisabled}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-purple-600 to-pink-600
                  hover:from-purple-700 hover:to-pink-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-[0.98] transition-all flex items-center justify-center gap-2
                  min-h-[50px]"
            >
                {isCreating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                    </>
                ) : (
                    <>
                        <Users className="w-5 h-5" />
                        Create Group ({memberCount} {memberCount === 1 ? 'member' : 'members'})
                    </>
                )}
            </button>
        </div>
    )
})
