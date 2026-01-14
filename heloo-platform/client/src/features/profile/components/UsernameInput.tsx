/**
 * UsernameInput Component
 * 
 * Reusable username input with validation status and availability check.
 * Shows real-time feedback as user types.
 * 
 * @module features/profile/components/UsernameInput
 */

import { Loader2, Check, X, AtSign } from 'lucide-react'
import { cn } from '@/utils/cn'

interface UsernameInputProps {
    value: string
    onChange: (value: string) => void
    isValid: boolean
    isAvailable: boolean | null
    isChecking: boolean
    error: string | null
    hasChanged: boolean
    disabled?: boolean
    maxLength?: number
}

const MAX_USERNAME_LENGTH = 20

export const UsernameInput = ({
    value,
    onChange,
    isValid,
    isAvailable,
    isChecking,
    error,
    hasChanged,
    disabled = false,
    maxLength = MAX_USERNAME_LENGTH,
}: UsernameInputProps) => {
    // Determine status icon and colors
    const showStatus = hasChanged && value.length >= 3
    const isSuccess = showStatus && isValid && isAvailable === true
    const isError = showStatus && (error || isAvailable === false)

    return (
        <div>
            <label htmlFor="profile-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <AtSign className="w-4 h-4" />
                </span>
                <input
                    id="profile-username"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="your_username"
                    maxLength={maxLength}
                    disabled={disabled}
                    autoComplete="off"
                    autoCapitalize="off"
                    className={cn(
                        "w-full pl-9 pr-10 py-3 rounded-xl border bg-gray-50 text-gray-900",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                        "disabled:opacity-50 transition-all placeholder:text-gray-400",
                        isSuccess && "border-green-400 focus:border-green-500",
                        isError && "border-red-300 focus:border-red-500"
                    )}
                />
                {/* Status indicator */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isChecking ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : isSuccess ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : isError ? (
                        <X className="w-4 h-4 text-red-500" />
                    ) : (
                        <span className="text-xs text-gray-400">{value.length}/{maxLength}</span>
                    )}
                </span>
            </div>
            {/* Error/help text */}
            {error && hasChanged && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {isSuccess && (
                <p className="text-xs text-green-600 mt-1">Username is available!</p>
            )}
            {!hasChanged && value && (
                <p className="text-xs text-gray-500 mt-1">Your current username</p>
            )}
        </div>
    )
}
