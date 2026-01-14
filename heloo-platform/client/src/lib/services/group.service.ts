/**
 * Group Service
 * 
 * Responsibility: Core group CRUD operations
 * Layer: Service (Data)
 * 
 * Member operations delegated to: groupMemberActions.ts
 * Settings operations delegated to: groupSettings.ts
 * Types defined in: group.types.ts
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Re-export types for backward compatibility
export type { Group, GroupMember, CreateGroupRequest, GroupServiceResponse } from './group.types'
import type { Group, CreateGroupRequest, GroupServiceResponse } from './group.types'

// Re-export member actions for backward compatibility
export {
    getGroupMembers,
    addMember,
    removeMember,
    leaveGroup,
    updateMemberRole,
    isGroupAdmin,
} from './groupMemberActions'

// Re-export settings actions for backward compatibility
export {
    toggleMute,
    getMuteStatus,
    isGroupCreator,
} from './groupSettings'

// Import for internal use
import { uploadGroupAvatar as uploadGroupAvatarAction } from './groupSettings'

// ===== Core Group Service =====

export const groupService = {
    /**
     * Create a new group and add members
     * Uses RPC function to bypass RLS and handle creation atomically
     */
    async createGroup(request: CreateGroupRequest): Promise<GroupServiceResponse<Group>> {
        try {
            // Validate
            if (!request.name.trim()) {
                return { success: false, error: 'Group name is required' }
            }

            if (request.memberIds.length === 0) {
                return { success: false, error: 'At least one member is required' }
            }

            // Use RPC to create group with members atomically
            const { data, error } = await supabase.rpc('create_group_with_members', {
                p_name: request.name.trim(),
                p_description: request.description?.trim() || null,
                p_member_ids: request.memberIds,
            })

            if (error) {
                logger.error('groupService:createGroup', 'RPC failed', error)
                return { success: false, error: error.message || 'Failed to create group' }
            }

            // RPC returns JSON with success and data/error
            const result = data as { success: boolean; data?: Group; error?: string }

            if (!result.success) {
                logger.error('groupService:createGroup', 'RPC returned error', result.error)
                return { success: false, error: result.error || 'Failed to create group' }
            }

            logger.info('groupService:createGroup', `Created group "${result.data?.name}" with ${request.memberIds.length + 1} members`)
            return { success: true, data: result.data as Group }
        } catch (error) {
            logger.error('groupService:createGroup', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    /**
     * Get group details by ID
     */
    async getGroup(groupId: string): Promise<GroupServiceResponse<Group>> {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single()

            if (error) {
                logger.error('groupService:getGroup', 'Failed to fetch group', error)
                return { success: false, error: error.message }
            }

            return { success: true, data: data as Group }
        } catch (error) {
            logger.error('groupService:getGroup', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    /**
     * Update group info (admin only)
     */
    async updateGroup(
        groupId: string,
        updates: Partial<Pick<Group, 'name' | 'description' | 'avatar_url'>>
    ): Promise<GroupServiceResponse<Group>> {
        try {
            const { data, error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', groupId)
                .select()
                .single()

            if (error) {
                logger.error('groupService:updateGroup', 'Failed to update group', error)
                return { success: false, error: error.message }
            }

            logger.info('groupService:updateGroup', `Updated group ${groupId}`)
            return { success: true, data: data as Group }
        } catch (error) {
            logger.error('groupService:updateGroup', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    /**
     * Delete a group (admin only)
     */
    async deleteGroup(groupId: string): Promise<GroupServiceResponse<void>> {
        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId)

            if (error) {
                logger.error('groupService:deleteGroup', 'Failed to delete group', error)
                return { success: false, error: error.message }
            }

            logger.info('groupService:deleteGroup', `Deleted group ${groupId}`)
            return { success: true }
        } catch (error) {
            logger.error('groupService:deleteGroup', 'Unexpected error', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    },

    /**
     * Upload group avatar
     * Delegates to groupSettings module
     */
    async uploadGroupAvatar(groupId: string, file: File): Promise<GroupServiceResponse<string>> {
        return uploadGroupAvatarAction(groupId, file, this.updateGroup.bind(this))
    },

    // ===== Delegated Member Actions (backward compatibility) =====
    // These are re-exported at the top, but also available on the service object

    async getGroupMembers(groupId: string) {
        const { getGroupMembers } = await import('./groupMemberActions')
        return getGroupMembers(groupId)
    },

    async addMember(groupId: string, userId: string) {
        const { addMember } = await import('./groupMemberActions')
        return addMember(groupId, userId)
    },

    async removeMember(groupId: string, userId: string) {
        const { removeMember } = await import('./groupMemberActions')
        return removeMember(groupId, userId)
    },

    async leaveGroup(groupId: string) {
        const { leaveGroup } = await import('./groupMemberActions')
        return leaveGroup(groupId)
    },

    async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member') {
        const { updateMemberRole } = await import('./groupMemberActions')
        return updateMemberRole(groupId, userId, role)
    },

    async isGroupAdmin(groupId: string, userId: string) {
        const { isGroupAdmin } = await import('./groupMemberActions')
        return isGroupAdmin(groupId, userId)
    },

    // ===== Delegated Settings Actions (backward compatibility) =====

    async toggleMute(groupId: string, mutedUntil: string | null) {
        const { toggleMute } = await import('./groupSettings')
        return toggleMute(groupId, mutedUntil)
    },

    async getMuteStatus(groupId: string) {
        const { getMuteStatus } = await import('./groupSettings')
        return getMuteStatus(groupId)
    },

    async isGroupCreator(groupId: string) {
        const { isGroupCreator } = await import('./groupSettings')
        return isGroupCreator(groupId)
    },
}
