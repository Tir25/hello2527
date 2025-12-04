import { motion } from 'framer-motion'

/**
 * Sidebar Header Component
 * 
 * Responsibility: Displays app logo/title
 * Layer: UI Component (View)
 */

export const SidebarHeader = () => {
    return (
        <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4"
        >
            He'loo
        </motion.h1>
    )
}
