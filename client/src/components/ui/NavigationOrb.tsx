import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { type LucideIcon, Settings, Menu, X, LayoutDashboard, MessageSquare } from 'lucide-react'
import { logger } from '@/lib/logger'
import { toast } from '@/store/toastStore'

type DomKeyboardEvent = globalThis.KeyboardEvent

interface MenuItemConfig {
  id: string
  icon: LucideIcon
  label: string
  action: () => Promise<void> | void
}

/**
 * COMPONENT: NavigationOrb
 * ========================
 * A floating, animated navigation menu with liquid core effects
 * and spring-physics fan-out interaction.
 */
export const NavigationOrb: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const DEG_TO_RAD = Math.PI / 180

  // Menu configuration
  const menuItems: MenuItemConfig[] = [
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Chat',
      action: () => {
        try {
          navigate('/')
        } catch (error) {
          logger.error('NavigationOrb:navigate', 'Failed to navigate to chat', error)
          toast.error('Failed to open chat')
        }
      },
    },
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      action: () => {
        try {
          navigate('/dashboard')
        } catch (error) {
          logger.error('NavigationOrb:navigate', 'Failed to navigate to dashboard', error)
          toast.error('Failed to open dashboard')
        }
      },
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      action: () => {
        try {
          navigate('/settings')
        } catch (error) {
          logger.error('NavigationOrb:navigate', 'Failed to navigate to settings', error)
          toast.error('Failed to open settings')
        }
      },
    },
  ]

  // Animation Variants
  const orbVariants: Variants = {
    breathing: {
      scale: [1, 1.03, 1],
      transition: {
        duration: 4.5,
        repeat: Infinity,
        ease: [0.4, 0.0, 0.2, 1], // smoother, more natural ease
      },
    },
    active: {
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  const bubbleContainerVariants: Variants = {
    open: {
      transition: { staggerChildren: 0.07, delayChildren: 0.1 },
    },
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  }

  // Helper to calculate fan position
  // We want an arc from roughly -65deg to +65deg for better spread
  const getBubblePosition = (index: number, total: number) => {
    const radius = 105 // Distance from center
    const startAngle = -65
    const endAngle = 65

    // Distribute angles evenly: (End - Start) / (Count - 1) gives exact spacing
    // If there is only 1 item, place it in the center (0 deg)
    const angleStep = total > 1 ? (endAngle - startAngle) / (total - 1) : 0
    const angleDeg = total > 1 ? startAngle + index * angleStep : 0

    // Convert to Radians (subtract 90deg because 0 is usually 3 o'clock in math)
    const angleRad = (angleDeg - 90) * DEG_TO_RAD

    return {
      x: radius * Math.cos(angleRad),
      y: radius * Math.sin(angleRad),
    }
  }

  const handleBubbleClick = async (item: MenuItemConfig) => {
    // Let the pop animation play briefly before executing the action/navigation
    await new Promise((resolve) => setTimeout(resolve, 180))
    await item.action()
    setIsOpen(false)
  }

  // Close menu on Escape for accessibility
  useEffect(() => {
    const handleKeyDown = (event: DomKeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-center pointer-events-none">
      {/* --- The Menu Fan --- */}
      {/* Wrapper uses pointer-events-none so only children are interactive */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center pointer-events-none"
            variants={bubbleContainerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="menu"
            aria-orientation="vertical"
          >
            {menuItems.map((item, index) => {
              const pos = getBubblePosition(index, menuItems.length)
              const Icon = item.icon

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleBubbleClick(item)}
                  className="pointer-events-auto absolute w-12 h-12 aspect-square rounded-full bg-slate-900/70 backdrop-blur-2xl border border-white/30 shadow-xl flex items-center justify-center group z-[90] relative flex-none"
                  variants={{
                    open: {
                      x: pos.x,
                      y: pos.y,
                      scale: 1,
                      opacity: 1,
                      transition: { type: 'spring', stiffness: 260, damping: 20 },
                    },
                    closed: {
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      },
                    },
                  }}
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(15,23,42,0.9)' }}
                  whileTap={{ scale: 1.4, opacity: 0, transition: { duration: 0.2 } }} // The "Pop" effect
                  role="menuitem"
                  aria-label={item.label}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {/* Bubble glow */}
                  <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-lg opacity-70 group-hover:bg-cyan-400/40 transition-colors" />

                  <Icon size={20} className="relative z-10 text-cyan-100" />

                  {/* Tooltip Label */}
                  <span className="absolute text-[10px] font-medium text-white bg-slate-900/90 backdrop-blur-md border border-cyan-300/40 px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:-translate-y-6 transition-all duration-150">
                    {item.label}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- The Orb Trigger --- */}
      <div
        className="relative group cursor-pointer pointer-events-auto"
        onClick={handleToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleToggle()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Outer Glow Layer (Behind) */}
        <motion.div
          className={`absolute inset-[-14px] rounded-full bg-cyan-400/40 blur-3xl transition-all duration-500 ${
            isOpen ? 'scale-125 opacity-100' : 'scale-100 opacity-70'
          }`}
        />

        {/* Floating soft shadow to sell the levitation */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black/40 blur-2xl opacity-70" />

        {/* Main Orb Container */}
        <motion.div
          variants={orbVariants}
          initial="breathing"
          animate={isOpen ? 'active' : 'breathing'}
          whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
          className="relative w-[64px] h-[64px] rounded-full shadow-[0_18px_55px_rgba(56,189,248,0.75)] flex items-center justify-center border border-cyan-200/30 z-[80] overflow-hidden bg-slate-950"
        >
          {/* --- LIQUID CORE ANIMATION --- */}

          {/* Layer 1: Slow rotating Cyan/Blue gradient */}
          <motion.div
            className="absolute inset-[-50%] w-[200%] h-[200%]"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, #0891b2 120deg, #4f46e5 240deg, transparent 360deg)',
              filter: 'blur(12px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />

          {/* Layer 2: Faster counter-rotating Purple/Magenta gradient for complexity */}
          <motion.div
            className="absolute inset-[-50%] w-[200%] h-[200%]"
            style={{
              background:
                'conic-gradient(from 180deg, transparent 0deg, #c026d3 120deg, #9333ea 240deg, transparent 360deg)',
              filter: 'blur(12px)',
              mixBlendMode: 'screen',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner Highlight to make it look like a sphere */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.45)_0%,transparent_60%)] z-10" />

          {/* Icon */}
          <motion.div
            className="relative z-20"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {isOpen ? (
              <X size={28} className="text-cyan-50 drop-shadow-[0_0_10px_rgba(56,189,248,1)]" />
            ) : (
              <Menu size={28} className="text-cyan-50 drop-shadow-[0_0_10px_rgba(56,189,248,1)]" />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default NavigationOrb


