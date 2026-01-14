/**
 * useUsernameEdit Hook
 * 
 * Handles username editing state and logic.
 * Provides debounced availability checking and validation.
 * 
 * @module features/profile/hooks/useUsernameEdit
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { usernameService } from '@/lib/services/username.service'

export interface UseUsernameEditOptions {
    initialUsername: string | null
}

export interface UseUsernameEditReturn {
    username: string
    setUsername: (value: string) => void
    isValid: boolean
    isAvailable: boolean | null
    isChecking: boolean
    error: string | null
    hasChanged: boolean
    save: () => Promise<{ success: boolean; error?: string }>
    isSaving: boolean
}

/**
 * Hook for managing username editing with debounced availability checking
 */
export function useUsernameEdit({
    initialUsername,
}: UseUsernameEditOptions): UseUsernameEditReturn {
    const [username, setUsernameState] = useState(initialUsername || '')
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const lastCheckedRef = useRef<string>('')

    // Determine if username has changed
    const normalizedInitial = (initialUsername || '').toLowerCase().trim()
    const normalizedCurrent = username.toLowerCase().trim()
    const hasChanged = normalizedCurrent !== normalizedInitial

    // Validate format locally
    const validation = usernameService.validateFormat(username)
    const isValid = validation.valid

    // Set username with debounced availability check
    const setUsername = useCallback((value: string) => {
        // Only allow lowercase, numbers, underscores
        const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
        setUsernameState(sanitized)
        setError(null)
        setIsAvailable(null)

        // Clear any pending check
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
    }, [])

    // Debounced availability check
    useEffect(() => {
        // Skip if same as initial (no need to check own username)
        if (!hasChanged || !isValid) {
            setIsAvailable(null)
            return
        }

        // Skip if already checked this value
        if (lastCheckedRef.current === normalizedCurrent) {
            return
        }

        setIsChecking(true)

        debounceRef.current = setTimeout(async () => {
            const result = await usernameService.checkAvailability(normalizedCurrent)
            lastCheckedRef.current = normalizedCurrent
            setIsAvailable(result.available)
            if (!result.available && result.error) {
                setError(result.error)
            }
            setIsChecking(false)
        }, 500) // 500ms debounce

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [normalizedCurrent, hasChanged, isValid])

    // Save username
    const save = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        if (!isValid) {
            return { success: false, error: validation.error }
        }
        if (!hasChanged) {
            return { success: true } // No change needed
        }
        if (isAvailable === false) {
            return { success: false, error: 'Username is already taken' }
        }

        setIsSaving(true)
        const result = await usernameService.updateUsername(normalizedCurrent)
        setIsSaving(false)

        if (result.success) {
            lastCheckedRef.current = normalizedCurrent
            setIsAvailable(null)
        }

        return result
    }, [isValid, hasChanged, isAvailable, normalizedCurrent, validation.error])

    // Compute display error
    const displayError = !isValid ? validation.error :
        isAvailable === false ? 'Username is already taken' :
            error

    return {
        username,
        setUsername,
        isValid,
        isAvailable,
        isChecking,
        error: displayError || null,
        hasChanged,
        save,
        isSaving,
    }
}
