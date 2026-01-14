import { useEffect, useRef, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import GlassCard from './GlassCard'
import { cn } from '@/utils/cn'

export interface ContextMenuOption {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  icon?: React.ReactNode
  disabled?: boolean
}

export interface ContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  options: ContextMenuOption[]
  onClose: () => void
}

/**
 * Context Menu Component
 * 
 * A glassmorphism context menu that appears at cursor position
 * Supports click outside to close and escape key
 */
export const ContextMenu = ({ isOpen, position, options, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Performance: Respect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion()

  // Reset focus when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0)
      // Focus first enabled option
      setTimeout(() => {
        const firstEnabled = options.findIndex(opt => !opt.disabled)
        if (firstEnabled >= 0 && buttonRefs.current[firstEnabled]) {
          buttonRefs.current[firstEnabled]?.focus()
          setFocusedIndex(firstEnabled)
        }
      }, 0)
    } else {
      setFocusedIndex(null)
    }
  }, [isOpen, options])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      const enabledOptions = options.map((opt, idx) => ({ opt, idx })).filter(({ opt }) => !opt.disabled)
      if (enabledOptions.length === 0) return

      let newIndex = focusedIndex ?? 0

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const currentIdx = enabledOptions.findIndex(({ idx }) => idx === focusedIndex)
        const nextIdx = currentIdx < enabledOptions.length - 1 ? currentIdx + 1 : 0
        newIndex = enabledOptions[nextIdx].idx
        setFocusedIndex(newIndex)
        buttonRefs.current[newIndex]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIdx = enabledOptions.findIndex(({ idx }) => idx === focusedIndex)
        const nextIdx = currentIdx > 0 ? currentIdx - 1 : enabledOptions.length - 1
        newIndex = enabledOptions[nextIdx].idx
        setFocusedIndex(newIndex)
        buttonRefs.current[newIndex]?.focus()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (focusedIndex !== null && !options[focusedIndex]?.disabled) {
          options[focusedIndex].onClick()
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, options, focusedIndex])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Use setTimeout to avoid immediate close on the click that opened the menu
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Calculate adjusted position synchronously to prevent flash
  // Use estimated dimensions (180px width, ~50px per option) for initial calculation
  const adjustedPosition = useMemo(() => {
    if (!isOpen) return { x: position.x, y: position.y }

    const estimatedWidth = 180
    const estimatedHeight = options.length * 50
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + estimatedWidth > viewportWidth) {
      x = viewportWidth - estimatedWidth - 10
    }
    if (x < 10) {
      x = 10
    }

    // Adjust vertical position
    if (y + estimatedHeight > viewportHeight) {
      y = viewportHeight - estimatedHeight - 10
    }
    if (y < 10) {
      y = 10
    }

    return { x, y }
  }, [isOpen, position.x, position.y, options.length])

  // Fine-tune position after render with actual dimensions
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = adjustedPosition.x
    let y = adjustedPosition.y

    // Fine-tune with actual dimensions
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10
    }
    if (x < 10) {
      x = 10
    }

    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10
    }
    if (y < 10) {
      y = 10
    }

    // Only update if position changed significantly
    if (Math.abs(menu.offsetLeft - x) > 5 || Math.abs(menu.offsetTop - y) > 5) {
      menu.style.left = `${x}px`
      menu.style.top = `${y}px`
    }
  }, [isOpen, adjustedPosition])

  // Use portal to render at document.body level, preventing clipping by parent overflow containers
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9999] pointer-events-auto"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -5 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{
              willChange: 'transform, opacity',
              transform: 'translateZ(0)' // Force GPU layer
            }}
          >
            <GlassCard
              variant="elevated"
              className="min-w-[180px] p-1 shadow-2xl border-white/30 backdrop-blur-lg"
              whileHover={undefined}
              whileTap={undefined}
            >
              <div className="flex flex-col" role="menu">
                {options.map((option, index) => (
                  <button
                    key={index}
                    ref={(el) => {
                      buttonRefs.current[index] = el
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={option.disabled ? -1 : focusedIndex === index ? 0 : -1}
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        option.onClick()
                        onClose()
                      }
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm rounded-lg min-h-[44px]',
                      'flex items-center gap-2',
                      'touch-target', // Ensure 44px minimum tap target
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/20 active:bg-white/30 active:scale-[0.98] cursor-pointer transition-colors duration-75',
                      focusedIndex === index && !option.disabled
                        ? 'bg-white/15 ring-2 ring-purple-400/50'
                        : '',
                      'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent',
                      option.variant === 'danger'
                        ? option.disabled
                          ? 'text-red-400'
                          : 'text-red-500 hover:text-red-600 hover:bg-red-500/10'
                        : 'text-gray-800'
                    )}
                  >
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span>{option.label}</span>
                    {option.disabled && (
                      <span className="ml-auto text-xs opacity-60">Processing...</span>
                    )}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
