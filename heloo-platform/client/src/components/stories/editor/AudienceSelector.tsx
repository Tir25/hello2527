/**
 * Audience Selector Component
 * Split Share button for "Your Story" / "Close Friends"
 *
 * @module components/stories/editor/AudienceSelector
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Globe, ChevronDown, Check, Settings } from 'lucide-react'
import { CloseFriendsManager } from './CloseFriendsManager'

export type AudienceType = 'public' | 'close_friends'

interface AudienceSelectorProps {
    value: AudienceType
    onChange: (audience: AudienceType) => void
}

const AUDIENCES = [
    { id: 'public' as const, label: 'Your Story', icon: Globe, description: 'Visible to followers' },
    { id: 'close_friends' as const, label: 'Close Friends', icon: Users, description: 'Only close friends' }
]

/**
 * Dropdown selector for story audience
 */
export const AudienceSelector = memo(function AudienceSelector({
    value,
    onChange
}: AudienceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isManagerOpen, setIsManagerOpen] = useState(false)
    const current = AUDIENCES.find(a => a.id === value) || AUDIENCES[0]

    return (
        <>
            <div className="relative">
                {/* Trigger Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-4 min-h-[44px] rounded-full text-sm font-medium transition-all touch-manipulation
                        ${value === 'close_friends'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}
                >
                    <current.icon className="w-4 h-4" />
                    <span>{current.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Menu - Opens upward */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 w-56 bg-zinc-900 border border-white/10 
                                    rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                                {AUDIENCES.map(audience => {
                                    const isSelected = value === audience.id
                                    return (
                                        <button
                                            key={audience.id}
                                            onClick={() => {
                                                onChange(audience.id)
                                                setIsOpen(false)
                                            }}
                                            className={`w-full flex items-center gap-3 p-4 min-h-[64px] text-left transition-colors touch-manipulation
                                                ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                        >
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                                                ${audience.id === 'close_friends' ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                                <audience.icon className={`w-5 h-5 
                                                    ${audience.id === 'close_friends' ? 'text-green-400' : 'text-white'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium">{audience.label}</p>
                                                <p className="text-zinc-500 text-xs">{audience.description}</p>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}

                                {/* Manage Close Friends */}
                                <div className="border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false)
                                            setIsManagerOpen(true)
                                        }}
                                        className="w-full flex items-center gap-3 p-4 min-h-[64px] text-left hover:bg-white/5 transition-colors touch-manipulation"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <Settings className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-300 font-medium">Manage Close Friends</p>
                                            <p className="text-zinc-500 text-xs">Add or remove friends</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Close Friends Manager Modal */}
            <CloseFriendsManager
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
            />
        </>
    )
})
