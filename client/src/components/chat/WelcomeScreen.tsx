import { motion } from 'framer-motion'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export const WelcomeScreen = () => {
  const { user, profile, profileLoading } = useAuthStore()

  // Get display name: profile full_name > profile username > user email (with proper fallback)
  const displayName =
    profile?.full_name || 
    profile?.username || 
    (user?.email?.split('@')[0]?.trim() || null) || 
    'there'

  return (
    <div className="flex-1 flex items-center justify-center p-8" role="main" aria-label="Welcome screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        {/* Icon Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            {/* Glowing background orb */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-cyan-400/30 rounded-full blur-2xl scale-150" />

            {/* Icon container with glass effect */}
            <div className="relative backdrop-blur-xl bg-white/70 rounded-full p-8 border border-white/20 shadow-xl">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                className="relative"
              >
                {/* Gradient background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-xl" />
                <MessageSquare
                  className="relative w-16 h-16 text-purple-600"
                  strokeWidth={1.5}
                />
              </motion.div>
            </div>

            {/* Floating sparkles */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-2"
              animate={{
                rotate: -360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.5,
              }}
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
        >
          Welcome to He'loo{profileLoading ? '' : `, ${displayName}`}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gray-600 text-lg leading-relaxed"
        >
          Select a conversation to start chatting securely.
        </motion.p>

        {/* Decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 flex justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

