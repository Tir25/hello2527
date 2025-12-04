import { useState } from 'react'
import { motion } from 'framer-motion'

interface MessageStatusProps {
  status: 'sent' | 'delivered' | 'seen'
  recipientAvatar?: string | null
  recipientThemeColor?: string
  isLastMessage?: boolean
}

// Constants for consistent sizing
const STATUS_SIZES = {
  sent: 'w-3.5 h-3.5', // 14px
  delivered: 'w-5 h-4', // 20px × 16px to fit two bubbles
  seen: 'w-4 h-4', // 16px (with internal padding for glow)
} as const

/**
 * Liquid/Organic Message Status Indicator
 * - Sent: Hollow pulsing ring (opacity 0.5)
 * - Delivered: Two solid bubbles with bounce animation
 * - Seen: Glowing bubble with recipient's avatar or theme color
 */
export const MessageStatus = ({
  status,
  recipientAvatar,
  recipientThemeColor = 'rgb(139, 92, 246)',
  isLastMessage = false,
}: MessageStatusProps) => {
  const [avatarError, setAvatarError] = useState(false)

  // Only animate if this is the last message (performance optimization)
  const shouldAnimate = isLastMessage

  // Sent: Hollow pulsing ring
  if (status === 'sent') {
    return (
      <motion.div
        className={`relative ${STATUS_SIZES.sent}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 0.2 }}
        aria-label="Message sent"
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/60"
          animate={
            shouldAnimate
              ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5],
                }
              : {}
          }
          transition={
            shouldAnimate
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        />
      </motion.div>
    )
  }

  // Delivered: Two solid bubbles with bounce
  if (status === 'delivered') {
    return (
      <motion.div
        className={`relative ${STATUS_SIZES.delivered}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 25,
        }}
        aria-label="Message delivered"
      >
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-white/80"
          style={{ left: '2px', top: '6px' }}
          animate={shouldAnimate ? { scale: [1, 1.1, 1] } : {}}
          transition={
            shouldAnimate
              ? {
                  duration: 0.5,
                  ease: 'easeOut',
                }
              : {}
          }
        />
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-white/80"
          style={{ left: '10px', top: '6px' }}
          animate={shouldAnimate ? { scale: [1, 1.1, 1] } : {}}
          transition={
            shouldAnimate
              ? {
                  duration: 0.5,
                  ease: 'easeOut',
                  delay: 0.1,
                }
              : {}
          }
        />
      </motion.div>
    )
  }

  // Seen: Glowing bubble with avatar or theme color
  return (
    <motion.div
      className={`relative ${STATUS_SIZES.seen}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
      }}
      aria-label="Message seen by recipient"
    >
      <motion.div
        className="absolute inset-[-3px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${recipientThemeColor}50, ${recipientThemeColor}20, transparent)`,
        }}
        animate={
          shouldAnimate
            ? {
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.9, 0.5],
              }
            : {}
        }
        transition={
          shouldAnimate
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      />
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          backgroundColor: recipientAvatar && !avatarError ? undefined : recipientThemeColor,
        }}
        animate={shouldAnimate ? { scale: [1, 1.05, 1] } : {}}
        transition={
          shouldAnimate
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {recipientAvatar && !avatarError ? (
          <img
            src={recipientAvatar}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
            onError={() => {
              setAvatarError(true)
            }}
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: recipientThemeColor }} />
        )}
      </motion.div>
    </motion.div>
  )
}

