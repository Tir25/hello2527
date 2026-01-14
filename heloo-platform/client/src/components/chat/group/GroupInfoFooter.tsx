/**
 * GroupInfoFooter Component
 * 
 * Footer section with Leave Group and Delete Group buttons.
 * Delete button only shown for group creator.
 * 
 * Responsibility: Group actions (leave/delete)
 */

import { memo } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { DeleteGroupButton } from './DeleteGroupButton'

interface GroupInfoFooterProps {
    groupId: string
    groupName: string
    isCreator: boolean
    isMobile: boolean
    leaving: boolean
    onLeaveGroup: () => void
    onDeleted: () => void
}

export const GroupInfoFooter = memo(({
    groupId,
    groupName,
    isCreator,
    isMobile,
    leaving,
    onLeaveGroup,
    onDeleted,
}: GroupInfoFooterProps) => {
    return (
        <div className={cn(
            "p-4 border-t border-gray-200/50 space-y-2 flex-shrink-0 bg-white",
            isMobile && "pb-safe-min"
        )}>
            <button
                onClick={onLeaveGroup}
                disabled={leaving}
                className="w-full py-3.5 px-4 rounded-xl font-medium text-red-600
                          bg-red-50 hover:bg-red-100 
                          disabled:opacity-50 disabled:cursor-not-allowed
                          active:scale-[0.98] transition-all flex items-center justify-center gap-2
                          min-h-[50px]"
            >
                {leaving ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Leaving...
                    </>
                ) : (
                    <>
                        <LogOut className="w-5 h-5" />
                        Leave Group
                    </>
                )}
            </button>

            <DeleteGroupButton
                groupId={groupId}
                groupName={groupName}
                isCreator={isCreator}
                onDeleted={onDeleted}
            />
        </div>
    )
})

GroupInfoFooter.displayName = 'GroupInfoFooter'
