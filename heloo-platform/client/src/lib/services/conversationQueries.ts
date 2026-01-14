/**
 * Conversation Queries
 * 
 * Responsibility: Handle conversation fetching operations
 * Layer: Service (Data)
 * 
 * Extracted from user.service.ts for modularity.
 * Single responsibility: Conversation list operations only.
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type {
    ConversationProfile,
    UnifiedConversation,
    GetConversationsResponse,
    GetUnifiedConversationsResponse,
    UnifiedConversationRPCResponse,
} from './user.types'

/**
 * Get conversations using unified RPC (maps to ConversationProfile)
 */
export const getConversations = async (): Promise<GetConversationsResponse> => {
    try {
        const { data, error } = await supabase.rpc('get_unified_conversations')

        if (error) {
            logger.error('conversationQueries:getConversations', 'Failed to fetch conversations', error)
            return {
                success: false,
                error: error.message || 'Failed to fetch conversations',
            }
        }

        // Map UnifiedConversation to ConversationProfile
        const rpcData = (data || []) as UnifiedConversationRPCResponse[]
        const conversations = rpcData.map((c) => ({
            id: c.id,
            full_name: c.name,
            username: c.username || c.name,
            avatar_url: c.avatar_url,
            email: c.email || '',
            status: c.status,
            last_seen: c.last_seen,
            created_at: '',
            last_message: c.last_message,
            last_message_time: c.last_message_time,
            unread_count: c.unread_count,
            relationship_status: c.relationship_status || (c.is_group ? 'group' : 'none'),
            is_archived: false,
            is_group: c.is_group,
            member_count: c.member_count,
            description: c.description,
        })) as ConversationProfile[]

        logger.info('conversationQueries:getConversations', `Successfully fetched ${conversations.length} unified conversations`)
        return {
            success: true,
            data: conversations,
        }
    } catch (error) {
        logger.error('conversationQueries:getConversations', 'Unexpected error fetching conversations', error)
        return {
            success: false,
            error: 'An unexpected error occurred while fetching conversations',
        }
    }
}

/**
 * Get archived conversations
 */
export const getArchivedConversations = async (): Promise<GetConversationsResponse> => {
    try {
        const { data, error } = await supabase.rpc('get_archived_conversations')

        if (error) {
            logger.error('conversationQueries:getArchivedConversations', 'Failed to fetch archived conversations', error)
            return {
                success: false,
                error: error.message || 'Failed to fetch archived conversations',
            }
        }

        const conversations = (data || []) as ConversationProfile[]

        logger.info('conversationQueries:getArchivedConversations', `Successfully fetched ${conversations.length} archived conversations`)
        return {
            success: true,
            data: conversations,
        }
    } catch (error) {
        logger.error('conversationQueries:getArchivedConversations', 'Unexpected error fetching archived conversations', error)
        return {
            success: false,
            error: 'An unexpected error occurred while fetching archived conversations',
        }
    }
}

/**
 * Get unified conversations (DMs + Groups) in a single sorted list
 * This is the new recommended method for fetching the inbox
 */
export const getUnifiedConversations = async (): Promise<GetUnifiedConversationsResponse> => {
    try {
        const { data, error } = await supabase.rpc('get_unified_conversations')

        if (error) {
            logger.error('conversationQueries:getUnifiedConversations', 'Failed to fetch unified conversations', error)
            return {
                success: false,
                error: error.message || 'Failed to fetch conversations',
            }
        }

        const conversations = (data || []) as UnifiedConversation[]

        logger.info('conversationQueries:getUnifiedConversations', `Fetched ${conversations.length} unified conversations`)
        return {
            success: true,
            data: conversations,
        }
    } catch (error) {
        logger.error('conversationQueries:getUnifiedConversations', 'Unexpected error', error)
        return {
            success: false,
            error: 'An unexpected error occurred while fetching conversations',
        }
    }
}

/**
 * Get unified archived conversations (DMs + Groups)
 */
export const getUnifiedArchivedConversations = async (): Promise<GetUnifiedConversationsResponse> => {
    try {
        const { data, error } = await supabase.rpc('get_unified_archived_conversations')

        if (error) {
            logger.error('conversationQueries:getUnifiedArchivedConversations', 'Failed to fetch archived conversations', error)
            return {
                success: false,
                error: error.message || 'Failed to fetch archived conversations',
            }
        }

        const conversations = (data || []) as UnifiedConversation[]

        logger.info('conversationQueries:getUnifiedArchivedConversations', `Fetched ${conversations.length} archived conversations`)
        return {
            success: true,
            data: conversations,
        }
    } catch (error) {
        logger.error('conversationQueries:getUnifiedArchivedConversations', 'Unexpected error', error)
        return {
            success: false,
            error: 'An unexpected error occurred while fetching archived conversations',
        }
    }
}
