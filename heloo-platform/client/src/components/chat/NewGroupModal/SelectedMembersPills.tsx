/**
 * NewGroupModal Selected Members Pills
 * 
 * Displays selected members as removable pills.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Profile } from '@/lib/services/profile.service'

interface SelectedMembersPillsProps {
    members: Profile[]
    onRemove: (member: Profile) => void
}

export const SelectedMembersPills = ({ members, onRemove }: SelectedMembersPillsProps) => {
    return (
        <AnimatePresence>
            {members.length > 0 && (
                <motion.div
                    className="flex flex-wrap gap-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    {members.map(member => (
                        <motion.button
                            key={member.id}
                            type="button"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => onRemove(member)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full 
                         bg-purple-100 text-purple-700 text-sm font-medium
                         hover:bg-purple-200 active:scale-95 transition-all
                         min-h-[40px]"
                        >
                            <span>{member.full_name || member.username}</span>
                            <X className="w-4 h-4" />
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
