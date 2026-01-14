/**
 * Group Settings Actions
 * 
 * Responsibility: Handle group settings and permission checks
 * Layer: Service (Data)
 * 
 * Extracted from group.service.ts for modularity.
 * Single responsibility: Mute status, creator check, avatar upload.
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { GroupServiceResponse, Group } from './group.types'

/**
 * Toggle mute for a group
 * @param mutedUntil - ISO timestamp to mute until, or null to unmute
 */
export const toggleMute = async (
    groupId: string,
    mutedUntil: string | null
): Promise<GroupServiceResponse<void>> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        const { error } = await supabase
            .from('group_members')
            .update({ muted_until: mutedUntil })
            .eq('group_id', groupId)
            .eq('user_id', user.id)

        if (error) {
            logger.error('groupSettings:toggleMute', 'Failed to toggle mute', error)
            return { success: false, error: error.message }
        }

        logger.info('groupSettings:toggleMute', `${mutedUntil ? 'Muted' : 'Unmuted'} group ${groupId}`)
        return { success: true }
    } catch (error) {
        logger.error('groupSettings:toggleMute', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Get current user's mute status for a group
 */
export const getMuteStatus = async (groupId: string): Promise<GroupServiceResponse<string | null>> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        const { data, error } = await supabase
            .from('group_members')
            .select('muted_until')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .single()

        if (error) {
            logger.error('groupSettings:getMuteStatus', 'Failed to get mute status', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data?.muted_until || null }
    } catch (error) {
        logger.error('groupSettings:getMuteStatus', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Check if current user is the group creator
 */
export const isGroupCreator = async (groupId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        const { data, error } = await supabase
            .from('groups')
            .select('created_by')
            .eq('id', groupId)
            .single()

        if (error || !data) return false
        return data.created_by === user.id
    } catch {
        return false
    }
}

/**
 * Upload group avatar
 * @param updateGroup - Update function to call after upload (dependency injection)
 */
export const uploadGroupAvatar = async (
    groupId: string,
    file: File,
    updateGroup: (groupId: string, updates: Partial<Pick<Group, 'avatar_url'>>) => Promise<GroupServiceResponse<Group>>
): Promise<GroupServiceResponse<string>> => {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${groupId}/${Date.now()}.${fileExt}`
        const filePath = `group-avatars/${fileName}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            logger.error('groupSettings:uploadGroupAvatar', 'Upload failed', uploadError)
            return { success: false, error: uploadError.message }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath)

        // Update group with new avatar URL
        const updateResult = await updateGroup(groupId, { avatar_url: publicUrl })
        if (!updateResult.success) {
            return { success: false, error: updateResult.error }
        }

        logger.info('groupSettings:uploadGroupAvatar', `Uploaded avatar for group ${groupId}`)
        return { success: true, data: publicUrl }
    } catch (error) {
        logger.error('groupSettings:uploadGroupAvatar', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
