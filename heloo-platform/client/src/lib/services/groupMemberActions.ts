/**
 * Group Member Actions
 * 
 * Responsibility: Handle group member management operations
 * Layer: Service (Data)
 * 
 * Extracted from group.service.ts for modularity.
 * Single responsibility: Member CRUD and role management only.
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Profile } from './profile.service'
import type { GroupServiceResponse, GroupMember } from './group.types'

/**
 * Get all members of a group with their profiles
 * Uses two-step query to avoid FK relationship issues
 */
export const getGroupMembers = async (groupId: string): Promise<GroupServiceResponse<GroupMember[]>> => {
    try {
        // Step 1: Fetch group members
        const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select('group_id, user_id, role, joined_at')
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true })

        if (membersError) {
            logger.error('groupMemberActions:getGroupMembers', 'Failed to fetch members', membersError)
            return { success: false, error: membersError.message }
        }

        if (!membersData || membersData.length === 0) {
            return { success: true, data: [] }
        }

        // Step 2: Fetch profiles for all member user_ids
        const userIds = membersData.map(m => m.user_id)
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, username, email, avatar_url, status')
            .in('id', userIds)

        if (profilesError) {
            logger.error('groupMemberActions:getGroupMembers', 'Failed to fetch profiles', profilesError)
            // Return members without profiles rather than failing completely
            const members = membersData.map(member => ({
                group_id: member.group_id,
                user_id: member.user_id,
                role: member.role as 'admin' | 'member',
                joined_at: member.joined_at,
                profile: undefined,
            }))
            return { success: true, data: members }
        }

        // Step 3: Create a map of profiles by user_id
        const profilesMap = new Map<string, Profile>()
        for (const profile of profilesData || []) {
            profilesMap.set(profile.id, profile as Profile)
        }

        // Step 4: Combine members with their profiles
        const members = membersData.map(member => ({
            group_id: member.group_id,
            user_id: member.user_id,
            role: member.role as 'admin' | 'member',
            joined_at: member.joined_at,
            profile: profilesMap.get(member.user_id),
        }))

        return { success: true, data: members }
    } catch (error) {
        logger.error('groupMemberActions:getGroupMembers', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Add a member to a group (admin only)
 */
export const addMember = async (groupId: string, userId: string): Promise<GroupServiceResponse<void>> => {
    try {
        const { error } = await supabase
            .from('group_members')
            .insert({ group_id: groupId, user_id: userId, role: 'member' })

        if (error) {
            logger.error('groupMemberActions:addMember', 'Failed to add member', error)
            return { success: false, error: error.message }
        }

        logger.info('groupMemberActions:addMember', `Added user ${userId} to group ${groupId}`)
        return { success: true }
    } catch (error) {
        logger.error('groupMemberActions:addMember', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Remove a member from a group (admin only, or user leaving)
 */
export const removeMember = async (groupId: string, userId: string): Promise<GroupServiceResponse<void>> => {
    try {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId)

        if (error) {
            logger.error('groupMemberActions:removeMember', 'Failed to remove member', error)
            return { success: false, error: error.message }
        }

        logger.info('groupMemberActions:removeMember', `Removed user ${userId} from group ${groupId}`)
        return { success: true }
    } catch (error) {
        logger.error('groupMemberActions:removeMember', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Leave a group (current user)
 */
export const leaveGroup = async (groupId: string): Promise<GroupServiceResponse<void>> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        return removeMember(groupId, user.id)
    } catch (error) {
        logger.error('groupMemberActions:leaveGroup', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Update a member's role (admin only)
 */
export const updateMemberRole = async (
    groupId: string,
    userId: string,
    role: 'admin' | 'member'
): Promise<GroupServiceResponse<void>> => {
    try {
        const { error } = await supabase
            .from('group_members')
            .update({ role })
            .eq('group_id', groupId)
            .eq('user_id', userId)

        if (error) {
            logger.error('groupMemberActions:updateMemberRole', 'Failed to update role', error)
            return { success: false, error: error.message }
        }

        logger.info('groupMemberActions:updateMemberRole', `Updated ${userId} role to ${role} in group ${groupId}`)
        return { success: true }
    } catch (error) {
        logger.error('groupMemberActions:updateMemberRole', 'Unexpected error', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Check if a user is an admin of a group
 */
export const isGroupAdmin = async (groupId: string, userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single()

        if (error) {
            logger.error('groupMemberActions:isGroupAdmin', 'Failed to check admin status', error)
            return false
        }

        return data?.role === 'admin'
    } catch {
        return false
    }
}
