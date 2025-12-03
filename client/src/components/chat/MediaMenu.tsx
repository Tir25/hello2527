import { motion, AnimatePresence } from 'framer-motion'
import { Image, Video, FileText, Mic } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface MediaMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: () => void
  onSelectVideo: () => void
  onSelectDocument: () => void
  onStartRecording: () => void
}

export const MediaMenu = ({
  isOpen,
  onClose,
  onSelectImage,
  onSelectVideo,
  onSelectDocument,
  onStartRecording,
}: MediaMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  const menuItems = [
    {
      icon: Image,
      label: 'Image',
      onClick: onSelectImage,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Video,
      label: 'Video',
      onClick: onSelectVideo,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      label: 'Document',
      onClick: onSelectDocument,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Mic,
      label: 'Audio',
      onClick: onStartRecording,
      gradient: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute bottom-full left-0 mb-2 z-50"
        >
          <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl shadow-xl p-2">
            <div className="flex gap-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      item.onClick()
                      onClose()
                    }}
                    className={`relative p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg hover:shadow-xl transition-all group`}
                    aria-label={item.label}
                  >
                    <Icon size={20} className="relative z-10" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {item.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

