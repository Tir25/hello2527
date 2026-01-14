/**
 * PrivateAccountView Component
 * 
 * Responsibility: Display private account placeholder
 * Layer: UI (Dumb Component)
 */

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

export const PrivateAccountView = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <GlassCard variant="elevated" className="p-12 text-center bg-white/90 border-gray-200 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            <Lock size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">This Account is Private</h3>
          <p className="text-gray-500 max-w-md">
            Follow this account to see their posts and stories.
          </p>
        </div>
      </GlassCard>
    </motion.div>
  )
}
