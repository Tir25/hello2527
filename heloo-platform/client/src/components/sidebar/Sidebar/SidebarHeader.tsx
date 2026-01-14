import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { NewGroupModal } from '@/components/chat/NewGroupModal'
import { logger } from '@/lib/logger'

/**
 * Sidebar Header Component
 * 
 * Responsibility: Displays app logo/title and new group button
 * Layer: UI Component (View)
 */

export const SidebarHeader = () => {
    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false)

    const handleGroupCreated = (groupId: string) => {
        // TODO: Navigate to the newly created group chat
        logger.info('SidebarHeader:handleGroupCreated', `Group created: ${groupId}`)
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
                >
                    He'loo
                </motion.h1>

                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsNewGroupModalOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full 
                              bg-gradient-to-r from-purple-600 to-pink-600 
                              hover:from-purple-700 hover:to-pink-700
                              text-white shadow-md hover:shadow-lg transition-all"
                    aria-label="Create new group"
                    title="Create new group"
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            <NewGroupModal
                isOpen={isNewGroupModalOpen}
                onClose={() => setIsNewGroupModalOpen(false)}
                onGroupCreated={handleGroupCreated}
            />
        </>
    )
}
