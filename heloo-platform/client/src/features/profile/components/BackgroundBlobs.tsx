/**
 * BackgroundBlobs Component
 * 
 * Responsibility: Animated background blobs
 * Layer: UI (Dumb Component)
 * 
 * Uses light theme colors for consistency with DashboardLayout
 */

import { motion } from 'framer-motion'

export const BackgroundBlobs = () => {
  return (
    <>
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  )
}
