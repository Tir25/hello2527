/**
 * Enhanced Draggable Overlay Component
 * Supports drag, scale, rotation, and delete zone
 *
 * @module components/stories/editor/DraggableOverlay
 */

import { memo, ReactNode, useState, useCallback, useRef } from 'react'
import { motion, PanInfo, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface DraggableOverlayProps {
    children: ReactNode
    x: number
    y: number
    scale?: number
    rotation?: number
    onDragEnd: (x: number, y: number) => void
    onDelete?: () => void
    className?: string
}

/** Delete zone component shown when dragging */
const DeleteZone = memo(function DeleteZone({ isActive }: { isActive: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full 
                flex items-center gap-2 transition-all duration-200 ${isActive
                    ? 'bg-red-500 scale-110'
                    : 'bg-black/60 backdrop-blur-md'
                }`}
        >
            <Trash2 className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                {isActive ? 'Release to delete' : 'Drag here to delete'}
            </span>
        </motion.div>
    )
})

/**
 * Makes children draggable with position tracking and delete zone
 */
export const DraggableOverlay = memo(function DraggableOverlay({
    children,
    x,
    y,
    scale = 1,
    rotation = 0,
    onDragEnd,
    onDelete,
    className = ''
}: DraggableOverlayProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isOverDelete, setIsOverDelete] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleDragStart = useCallback(() => {
        setIsDragging(true)
    }, [])

    const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!onDelete) return

        // Check if over delete zone (bottom center of screen)
        const container = containerRef.current?.parentElement
        if (container) {
            const containerRect = container.getBoundingClientRect()
            const absoluteY = y + info.offset.y + containerRect.top + containerRect.height / 2
            const absoluteX = x + info.offset.x + containerRect.left + containerRect.width / 2
            const isNearBottom = absoluteY > window.innerHeight - 180
            const isNearCenter = Math.abs(absoluteX - window.innerWidth / 2) < 120
            setIsOverDelete(isNearBottom && isNearCenter)
        }
    }, [x, y, onDelete])

    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false)

        if (isOverDelete && onDelete) {
            onDelete()
            setIsOverDelete(false)
            return
        }

        onDragEnd(x + info.offset.x, y + info.offset.y)
        setIsOverDelete(false)
    }, [x, y, onDragEnd, onDelete, isOverDelete])

    return (
        <>
            <motion.div
                ref={containerRef}
                drag
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ x, y, scale, rotate: rotation }}
                whileDrag={{ scale: scale * 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`absolute inset-0 flex items-center justify-center cursor-move pointer-events-auto touch-none ${className}`}
            >
                {children}
            </motion.div>

            {/* Delete Zone - only show when dragging and onDelete is provided */}
            <AnimatePresence>
                {isDragging && onDelete && (
                    <DeleteZone isActive={isOverDelete} />
                )}
            </AnimatePresence>
        </>
    )
})
