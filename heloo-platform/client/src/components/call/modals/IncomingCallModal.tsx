/**
 * IncomingCallModal Component
 * 
 * Overlay modal for answering or declining an incoming call.
 * Glass morphism design with animated ring effect.
 * 
 * @module components/call/modals/IncomingCallModal
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video, User } from 'lucide-react'
import type { IncomingCall } from '@/hooks/call/useCallSignaling'

export interface IncomingCallModalProps {
    /** Incoming call data */
    incomingCall: IncomingCall
    /** Handler to answer the call */
    onAnswer: () => Promise<void>
    /** Handler to decline the call */
    onDecline: () => Promise<void>
}

/**
 * IncomingCallModal - Answer/Decline overlay for incoming calls
 */
export const IncomingCallModal = memo(function IncomingCallModal({
    incomingCall,
    onAnswer,
    onDecline,
}: IncomingCallModalProps) {
    const [isAnswering, setIsAnswering] = useState(false)
    const [isDeclining, setIsDeclining] = useState(false)
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    const handleAnswer = useCallback(async () => {
        if (isAnswering || isDeclining) return
        setIsAnswering(true)
        try {
            await onAnswer()
        } finally {
            if (isMountedRef.current) {
                setIsAnswering(false)
            }
        }
    }, [isAnswering, isDeclining, onAnswer])

    const handleDecline = useCallback(async () => {
        if (isAnswering || isDeclining) return
        setIsDeclining(true)
        try {
            await onDecline()
        } finally {
            if (isMountedRef.current) {
                setIsDeclining(false)
            }
        }
    }, [isAnswering, isDeclining, onDecline])

    const callerName = incomingCall.caller.name || 'Unknown'
    const callerAvatar = incomingCall.caller.avatar

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="flex flex-col items-center gap-8 p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-white/10 shadow-2xl"
                >
                    {/* Caller Info */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Animated ring around avatar */}
                        <div className="relative">
                            {/* Pulsing ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-green-500/20"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 0, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full bg-green-500/20"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 0, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.5,
                                }}
                            />

                            {/* Avatar */}
                            {callerAvatar ? (
                                <img
                                    src={callerAvatar}
                                    alt={callerName}
                                    className="relative w-28 h-28 rounded-full object-cover border-4 border-green-500/50"
                                />
                            ) : (
                                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border-4 border-green-500/50 flex items-center justify-center">
                                    <User className="w-12 h-12 text-white/60" />
                                </div>
                            )}
                        </div>

                        {/* Caller name */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white">{callerName}</h2>
                            <p className="text-sm text-white/60 flex items-center gap-2 justify-center mt-1">
                                {incomingCall.isVideo ? (
                                    <>
                                        <Video className="w-4 h-4" />
                                        Incoming video call
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-4 h-4" />
                                        Incoming voice call
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-8">
                        {/* Decline Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDecline}
                            disabled={isAnswering || isDeclining}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg shadow-red-500/30">
                                <PhoneOff className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-sm text-white/80">Decline</span>
                        </motion.button>

                        {/* Answer Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAnswer}
                            disabled={isAnswering || isDeclining}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center shadow-lg shadow-green-500/30">
                                {incomingCall.isVideo ? (
                                    <Video className="w-7 h-7 text-white" />
                                ) : (
                                    <Phone className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <span className="text-sm text-white/80">Answer</span>
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
})

export default IncomingCallModal
