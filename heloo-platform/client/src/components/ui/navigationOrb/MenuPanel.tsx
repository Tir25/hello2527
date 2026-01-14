/**
 * MenuPanel Component
 * 
 * Container for the fan menu items with staggered animations.
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem } from './MenuItem'
import { getBubbleContainerVariants } from './animations'
import { calculateBubblePosition } from './constants'
import type { MenuPanelProps } from './types'

/**
 * Menu panel containing all fan items.
 */
export const MenuPanel: React.FC<MenuPanelProps> = ({
    isOpen,
    items,
    prefersReducedMotion,
    focusedIndex,
    itemRefs,
    onItemClick,
    onKeyDown,
    menuId,
}) => {
    // Memoize container variants
    const containerVariants = useMemo(
        () => getBubbleContainerVariants(prefersReducedMotion),
        [prefersReducedMotion]
    )

    // Memoize positions for all items
    const positions = useMemo(
        () => items.map((_, index) => calculateBubblePosition(index, items.length)),
        [items]
    )

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id={menuId}
                    role="menu"
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    variants={containerVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    onKeyDown={onKeyDown}
                >
                    {items.map((item, index) => (
                        <MenuItem
                            key={item.id}
                            ref={(el) => {
                                if (itemRefs.current) {
                                    itemRefs.current[index] = el
                                }
                            }}
                            item={item}
                            x={positions[index].x}
                            y={positions[index].y}
                            index={index}
                            isOpen={isOpen}
                            prefersReducedMotion={prefersReducedMotion}
                            isFocused={focusedIndex === index}
                            onClick={() => onItemClick(item)}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
