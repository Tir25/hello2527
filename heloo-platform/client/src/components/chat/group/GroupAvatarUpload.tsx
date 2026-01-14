/**
 * GroupAvatarUpload Component
 * 
 * Clickable avatar with upload functionality for groups.
 * Reuses core logic from user AvatarUpload.
 * 
 * Responsibility: Group avatar display and upload
 */

import { useState, useRef, useCallback, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Camera, Users, Loader2 } from 'lucide-react'
import { groupService } from '@/lib/services/group.service'
import { toast } from '@/store/toastStore'
import { cn } from '@/utils/cn'

interface GroupAvatarUploadProps {
    groupId: string
    currentAvatarUrl: string | null
    groupName: string
    isAdmin: boolean
    onAvatarChange: (newUrl: string) => void
    className?: string
}

export const GroupAvatarUpload = ({
    groupId,
    currentAvatarUrl,
    groupName,
    isAdmin,
    onAvatarChange,
    className,
}: GroupAvatarUploadProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
            event.target.value = ''
            return
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error('Image size must be less than 5MB')
            event.target.value = ''
            return
        }

        // Create preview
        const blobUrl = URL.createObjectURL(file)
        setPreviewUrl(blobUrl)
        setUploading(true)

        // Upload
        const result = await groupService.uploadGroupAvatar(groupId, file)

        if (result.success && result.data) {
            onAvatarChange(result.data)
            toast.success('Group avatar updated')
            URL.revokeObjectURL(blobUrl)
            setPreviewUrl(null)
        } else {
            toast.error(result.error || 'Failed to upload avatar')
        }

        setUploading(false)
        event.target.value = ''
    }, [groupId, onAvatarChange])

    const handleClick = useCallback(() => {
        if (isAdmin && !uploading) {
            fileInputRef.current?.click()
        }
    }, [isAdmin, uploading])

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if ((event.key === 'Enter' || event.key === ' ') && isAdmin) {
            event.preventDefault()
            handleClick()
        }
    }, [handleClick, isAdmin])

    const displayUrl = previewUrl || currentAvatarUrl

    return (
        <div className={cn('flex justify-center', className)}>
            <motion.div
                className={cn(
                    "relative group",
                    isAdmin && "cursor-pointer"
                )}
                whileHover={isAdmin ? { scale: 1.02 } : undefined}
                whileTap={isAdmin ? { scale: 0.98 } : undefined}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role={isAdmin ? "button" : undefined}
                tabIndex={isAdmin ? 0 : undefined}
                aria-label={isAdmin ? "Upload group avatar" : undefined}
            >
                {/* Avatar */}
                {displayUrl ? (
                    <img
                        src={displayUrl}
                        alt={groupName}
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                                  flex items-center justify-center ring-4 ring-purple-100">
                        <Users className="w-12 h-12 text-white" />
                    </div>
                )}

                {/* Uploading overlay */}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center 
                                  bg-black/60 backdrop-blur-sm rounded-full">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                {/* Hover overlay (admin only) */}
                {isAdmin && !uploading && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center 
                                  bg-black/40 backdrop-blur-sm rounded-full 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                        <Camera size={32} className="text-white" />
                    </motion.div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={!isAdmin || uploading}
                />
            </motion.div>
        </div>
    )
}
