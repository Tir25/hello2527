/**
 * EditProfileModal Component
 * 
 * Modal for editing user profile (name, status, avatar).
 * Opens when user clicks "Edit Profile" button on own profile.
 * 
 * Responsibility: Profile editing UI
 * Layer: UI (Smart Component)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Check } from 'lucide-react'
import { profileService } from '../services/profile.service'
import { avatarService } from '../services/avatar.service'
import { toast } from '@/store/toastStore'
import { triggerHaptic, useIsMobileUI } from '@/hooks/useIsMobileUI'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/utils/cn'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { UsernameInput } from './UsernameInput'
import { useUsernameEdit } from '../hooks/useUsernameEdit'
import type { Profile, ProfileUpdateData } from '../types/profile.types'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile
    onUpdate: () => void
}

const MAX_NAME_LENGTH = 100
const MAX_STATUS_LENGTH = 100

export const EditProfileModal = ({
    isOpen,
    onClose,
    profile,
    onUpdate,
}: EditProfileModalProps) => {
    const [name, setName] = useState(profile.full_name || '')
    const [status, setStatus] = useState(profile.status || '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const isMobile = useIsMobileUI()
    const modalRef = useRef<HTMLDivElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    // Username editing hook
    const usernameEdit = useUsernameEdit({
        initialUsername: profile.username,
    })

    useFocusTrap(modalRef, { isActive: isOpen, initialFocusRef: nameInputRef })

    useEffect(() => {
        if (isOpen) {
            setName(profile.full_name || '')
            setStatus(profile.status || '')
            setAvatarUrl(profile.avatar_url)
        }
    }, [isOpen, profile])

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving && !uploadingAvatar) onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            return () => document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose, saving, uploadingAvatar])

    const hasProfileChanges = name !== (profile.full_name || '') ||
        status !== (profile.status || '') ||
        avatarUrl !== profile.avatar_url
    const hasChanges = hasProfileChanges || usernameEdit.hasChanged
    const isValid = name.trim().length > 0 && name.length <= MAX_NAME_LENGTH &&
        (!usernameEdit.hasChanged || (usernameEdit.isValid && usernameEdit.isAvailable !== false))

    const handleAvatarSelect = useCallback(async (file: File) => {
        setUploadingAvatar(true)
        const result = await avatarService.uploadAvatar(profile.id, file)
        if (result.success && result.url) {
            setAvatarUrl(result.url)
            toast.success('Avatar updated')
        } else {
            toast.error(result.error || 'Failed to upload avatar')
        }
        setUploadingAvatar(false)
    }, [profile.id])

    const handleSave = useCallback(async () => {
        if (!isValid) return

        triggerHaptic('light')
        setSaving(true)

        // Save username first if changed
        if (usernameEdit.hasChanged) {
            const usernameResult = await usernameEdit.save()
            if (!usernameResult.success) {
                toast.error(usernameResult.error || 'Failed to update username')
                setSaving(false)
                return
            }
        }

        // Save profile changes if any
        if (hasProfileChanges) {
            const updates: ProfileUpdateData = { full_name: name.trim(), status: status.trim() || undefined }
            const result = await profileService.updateProfile(profile.id, updates)
            if (!result.success) {
                toast.error(result.error || 'Failed to update profile')
                setSaving(false)
                return
            }
        }

        toast.success('Profile updated')
        onUpdate()
        onClose()
        setSaving(false)
    }, [profile.id, name, status, isValid, hasProfileChanges, usernameEdit, onUpdate, onClose])

    const handleClose = useCallback(() => {
        if (!saving && !uploadingAvatar) {
            triggerHaptic('light')
            onClose()
        }
    }, [saving, uploadingAvatar, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} />
                    <motion.div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"
                        className={cn("fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden",
                            isMobile ? "inset-x-4 bottom-4 top-auto max-h-[85vh]" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md")}
                        initial={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.95, opacity: 0 }}
                        animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
                        exit={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 id="edit-profile-title" className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                            <button type="button" onClick={handleClose} disabled={saving || uploadingAvatar}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50" aria-label="Close">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        {/* Form */}
                        <div className="p-4 space-y-5 overflow-y-auto max-h-[55vh]">
                            <div className="flex flex-col items-center gap-2">
                                <AvatarUpload avatarUrl={avatarUrl} onFileSelect={handleAvatarSelect} uploading={uploadingAvatar}
                                    profile={{ ...profile, avatar_url: avatarUrl }} />
                                <p className="text-xs text-gray-500">Tap to change photo</p>
                            </div>
                            {/* Username field */}
                            <UsernameInput
                                value={usernameEdit.username}
                                onChange={usernameEdit.setUsername}
                                isValid={usernameEdit.isValid}
                                isAvailable={usernameEdit.isAvailable}
                                isChecking={usernameEdit.isChecking}
                                error={usernameEdit.error}
                                hasChanged={usernameEdit.hasChanged}
                                disabled={saving}
                            />
                            <div>
                                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                                <div className="relative">
                                    <input ref={nameInputRef} id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name" maxLength={MAX_NAME_LENGTH} disabled={saving}
                                        className={cn("w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 transition-all placeholder:text-gray-400", name.trim().length === 0 && "border-red-300")} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{name.length}/{MAX_NAME_LENGTH}</span>
                                </div>
                                {name.trim().length === 0 && <p className="text-xs text-red-500 mt-1">Name is required</p>}
                            </div>
                            <div>
                                <label htmlFor="profile-status" className="block text-sm font-medium text-gray-700 mb-1.5">Bio (optional)</label>
                                <div className="relative">
                                    <textarea id="profile-status" value={status} onChange={(e) => setStatus(e.target.value)}
                                        placeholder="Tell us about yourself..." maxLength={MAX_STATUS_LENGTH} rows={3} disabled={saving}
                                        className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 transition-all resize-none placeholder:text-gray-400" />
                                    <span className="absolute right-3 bottom-3 text-xs text-gray-400">{status.length}/{MAX_STATUS_LENGTH}</span>
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className={cn("p-4 border-t border-gray-100 flex-shrink-0", isMobile && "pb-safe-min")}>
                            <button type="button" onClick={handleSave} disabled={!isValid || !hasChanges || saving || uploadingAvatar}
                                className={cn("w-full py-3.5 px-4 rounded-xl font-medium bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[50px]")}>
                                {saving ? <><Loader2 className="w-5 h-5 animate-spin" />Saving...</> : <><Check className="w-5 h-5" />Save Changes</>}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
