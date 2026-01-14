/**
 * CallContext
 * 
 * Context and hooks for accessing call state.
 * @module context/call/context
 */

import { createContext, useContext } from 'react'
import type { CallContextType } from './types'

export const CallContext = createContext<CallContextType | null>(null)

/**
 * Hook to access call context
 */
export function useCallContext(): CallContextType {
    const context = useContext(CallContext)
    if (!context) {
        throw new Error('useCallContext must be used within a CallProvider')
    }
    return context
}

/**
 * Convenience hook with computed isInCall property
 */
export function useCall() {
    const context = useCallContext()
    return {
        ...context,
        isInCall: context.callStatus !== 'idle',
    }
}
