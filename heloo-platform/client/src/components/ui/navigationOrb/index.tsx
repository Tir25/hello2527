/**
 * NavigationOrb Component
 * 
 * Modern floating navigation with CSS-based animations.
 * Optimized for mobile performance - no backdrop-blur on items.
 * 
 * @module components/ui/navigationOrb
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, MessageCircle, Search, User, Bell, LayoutDashboard } from 'lucide-react'
import { useKeyboardVisibility } from './useKeyboardVisibility'
import { useStoryStore } from '@/store/storyStore'
import './NavigationOrb.css'

interface MenuItem {
    id: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    label: string
    path: string
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'chat', icon: MessageCircle, label: 'Chat', path: '/' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { id: 'activity', icon: Bell, label: 'Activity', path: '/activity' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
]

/**
 * Main NavigationOrb component
 */
export const NavigationOrb: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const isKeyboardVisible = useKeyboardVisibility()
    const isCreatorOpen = useStoryStore((s) => s.isCreatorOpen)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Toggle menu
    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev)
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10)
        }
    }, [])

    // Navigate to page
    const handleNavigate = useCallback((item: MenuItem) => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(5)
        }

        // Close menu and navigate immediately
        setIsOpen(false)
        navigate(item.path)
    }, [navigate])

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    // Keyboard navigation within menu
    const handleItemKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        const itemCount = MENU_ITEMS.length
        let nextIndex = index

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault()
                nextIndex = (index + 1) % itemCount
                break
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault()
                nextIndex = (index - 1 + itemCount) % itemCount
                break
            case 'Home':
                e.preventDefault()
                nextIndex = 0
                break
            case 'End':
                e.preventDefault()
                nextIndex = itemCount - 1
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                handleNavigate(MENU_ITEMS[index])
                return
        }

        itemRefs.current[nextIndex]?.focus()
    }, [handleNavigate])

    // Get current path for active indicator
    const currentPath = location.pathname

    // Hide when keyboard visible or story creator open
    if (isKeyboardVisible || isCreatorOpen) {
        return null
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`nav-orb-backdrop ${isOpen ? 'visible' : ''}`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Navigation Wrapper */}
            <div
                ref={wrapperRef}
                className={`nav-orb-wrapper ${isOpen ? 'nav-orb-open' : ''}`}
                role="navigation"
                aria-label="Main navigation"
            >
                {/* Menu Items */}
                {MENU_ITEMS.map((item, index) => {
                    const Icon = item.icon
                    // Exact path match only - no special cases
                    const isActive = currentPath === item.path

                    return (
                        <button
                            key={item.id}
                            ref={el => { itemRefs.current[index] = el }}
                            className={`nav-orb-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleNavigate(item)}
                            onKeyDown={(e) => handleItemKeyDown(e, index)}
                            tabIndex={isOpen ? 0 : -1}
                            role="menuitem"
                            aria-label={item.label}
                        >
                            <Icon size={20} />
                            <span className="nav-orb-label">{item.label}</span>
                        </button>
                    )
                })}

                {/* Main Orb Button */}
                <button
                    className="nav-orb-btn"
                    onClick={handleToggle}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
                >
                    <Plus size={28} className="nav-orb-icon" />
                </button>
            </div>
        </>
    )
}

export default NavigationOrb
