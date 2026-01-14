-- ============================================
-- He'loo Platform - Fix Sidebar Sync Issues
-- Created: 2025-12-25
-- Addresses: Missing RPC, wrong last_message, chat deletion logic
-- ============================================

-- ============================================
-- PART 1: Create get_my_conversation_settings RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_conversation_settings()
RETURNS TABLE(
    partner_id UUID,
    chat_deleted_at TIMESTAMPTZ,
    is_archived BOOLEAN,
    is_muted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.partner_id, 
        cs.chat_deleted_at, 
        COALESCE(cs.is_archived, false) AS is_archived, 
        COALESCE(cs.is_muted, false) AS is_muted
    FROM public.conversation_settings cs
    WHERE cs.owner_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_conversation_settings() TO authenticated;

-- ============================================
-- PART 2: Fix get_unified_conversations
-- Now correctly handles chat_deleted_at for:
-- 1. Filtering last_message (only show messages AFTER deletion)
-- 2. Showing chats that have new messages after deletion
-- ============================================

DROP FUNCTION IF EXISTS public.get_unified_conversations();

CREATE OR REPLACE FUNCTION public.get_unified_conversations()
RETURNS TABLE(
    id UUID,
    name TEXT,
    avatar_url TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT,
    is_group BOOLEAN,
    member_count INT,
    email TEXT,
    username TEXT,
    phone TEXT,
    status TEXT,
    last_seen TIMESTAMPTZ,
    chat_deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    -- Step 1: Find all DM partners (anyone we've messaged with)
    WITH dm_partners AS (
        SELECT DISTINCT
            CASE
                WHEN m.sender_id = v_user_id THEN m.receiver_id
                ELSE m.sender_id
            END AS partner_id
        FROM public.messages m
        WHERE m.receiver_id IS NOT NULL
          AND (m.sender_id = v_user_id OR m.receiver_id = v_user_id)
          AND NOT (v_user_id = ANY(m.deleted_for))
    ),
    -- Step 2: Get conversation settings for each partner
    partner_settings AS (
        SELECT 
            dp.partner_id,
            cs.chat_deleted_at,
            COALESCE(cs.is_archived, false) AS is_archived
        FROM dm_partners dp
        LEFT JOIN public.conversation_settings cs 
            ON cs.owner_id = v_user_id AND cs.partner_id = dp.partner_id
    ),
    -- Step 3: Find last message AFTER chat_deleted_at (respects soft delete)
    dm_last_messages AS (
        SELECT DISTINCT ON (ps.partner_id)
            ps.partner_id,
            CASE WHEN m.is_unsent THEN 'This message was deleted' ELSE m.content END AS last_msg,
            m.created_at AS last_msg_time,
            ps.chat_deleted_at,
            ps.is_archived
        FROM partner_settings ps
        LEFT JOIN LATERAL (
            SELECT m.content, m.created_at, m.is_unsent
            FROM public.messages m
            WHERE 
                -- Message belongs to this conversation
                ((m.sender_id = v_user_id AND m.receiver_id = ps.partner_id) 
                 OR (m.sender_id = ps.partner_id AND m.receiver_id = v_user_id))
                -- Not individually deleted
                AND NOT (v_user_id = ANY(m.deleted_for))
                -- CRITICAL: Only messages AFTER chat deletion (if deleted)
                AND (ps.chat_deleted_at IS NULL OR m.created_at > ps.chat_deleted_at)
            ORDER BY m.created_at DESC
            LIMIT 1
        ) m ON true
    ),
    -- Step 4: Filter active conversations (not archived, has visible messages)
    active_dm_conversations AS (
        SELECT 
            dlm.partner_id,
            dlm.last_msg,
            dlm.last_msg_time,
            dlm.chat_deleted_at
        FROM dm_last_messages dlm
        WHERE 
            -- Not archived
            dlm.is_archived IS NOT TRUE
            -- Has at least one visible message (after deletion if applicable)
            AND dlm.last_msg_time IS NOT NULL
    ),
    -- Step 5: Build DM conversation records
    dm_conversations AS (
        SELECT
            p.id,
            COALESCE(p.full_name, p.username, p.email) AS name,
            p.avatar_url,
            adc.last_msg AS last_message,
            adc.last_msg_time AS last_message_time,
            0::BIGINT AS unread_count,
            FALSE AS is_group,
            NULL::INT AS member_count,
            p.email,
            p.username,
            p.phone,
            p.status,
            p.last_seen,
            adc.chat_deleted_at
        FROM active_dm_conversations adc
        JOIN public.profiles p ON p.id = adc.partner_id
    ),
    -- Step 6: Handle group conversations (unchanged logic)
    group_last_messages AS (
        SELECT DISTINCT ON (m.group_id)
            m.group_id,
            CASE WHEN m.is_unsent THEN 'This message was deleted' ELSE m.content END AS last_msg,
            m.created_at AS last_msg_time
        FROM public.messages m
        WHERE m.group_id IS NOT NULL
          AND NOT (v_user_id = ANY(m.deleted_for))
        ORDER BY m.group_id, m.created_at DESC
    ),
    group_conversations AS (
        SELECT
            g.id,
            g.name,
            g.avatar_url,
            glm.last_msg AS last_message,
            glm.last_msg_time AS last_message_time,
            0::BIGINT AS unread_count,
            TRUE AS is_group,
            (SELECT COUNT(*)::INT FROM public.group_members WHERE group_id = g.id) AS member_count,
            NULL::TEXT AS email,
            NULL::TEXT AS username,
            NULL::TEXT AS phone,
            NULL::TEXT AS status,
            NULL::TIMESTAMPTZ AS last_seen,
            NULL::TIMESTAMPTZ AS chat_deleted_at
        FROM public.groups g
        JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = v_user_id
        LEFT JOIN group_last_messages glm ON glm.group_id = g.id
    )
    -- Combine and sort
    SELECT * FROM dm_conversations
    UNION ALL
    SELECT * FROM group_conversations
    ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unified_conversations() TO authenticated;

-- ============================================
-- PART 3: Update get_archived_conversations to match
-- ============================================

DROP FUNCTION IF EXISTS public.get_archived_conversations();

CREATE OR REPLACE FUNCTION public.get_archived_conversations()
RETURNS TABLE(
    id UUID,
    name TEXT,
    avatar_url TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT,
    is_group BOOLEAN,
    member_count INT,
    email TEXT,
    username TEXT,
    phone TEXT,
    status TEXT,
    last_seen TIMESTAMPTZ,
    chat_deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH archived_partners AS (
        SELECT cs.partner_id, cs.chat_deleted_at
        FROM public.conversation_settings cs
        WHERE cs.owner_id = v_user_id AND cs.is_archived = true
    ),
    archived_last_messages AS (
        SELECT DISTINCT ON (ap.partner_id)
            ap.partner_id,
            CASE WHEN m.is_unsent THEN 'This message was deleted' ELSE m.content END AS last_msg,
            m.created_at AS last_msg_time,
            ap.chat_deleted_at
        FROM archived_partners ap
        LEFT JOIN LATERAL (
            SELECT m.content, m.created_at, m.is_unsent
            FROM public.messages m
            WHERE 
                ((m.sender_id = v_user_id AND m.receiver_id = ap.partner_id) 
                 OR (m.sender_id = ap.partner_id AND m.receiver_id = v_user_id))
                AND NOT (v_user_id = ANY(m.deleted_for))
                AND (ap.chat_deleted_at IS NULL OR m.created_at > ap.chat_deleted_at)
            ORDER BY m.created_at DESC
            LIMIT 1
        ) m ON true
    )
    SELECT
        p.id,
        COALESCE(p.full_name, p.username, p.email) AS name,
        p.avatar_url,
        alm.last_msg AS last_message,
        alm.last_msg_time AS last_message_time,
        0::BIGINT AS unread_count,
        FALSE AS is_group,
        NULL::INT AS member_count,
        p.email,
        p.username,
        p.phone,
        p.status,
        p.last_seen,
        alm.chat_deleted_at
    FROM archived_last_messages alm
    JOIN public.profiles p ON p.id = alm.partner_id
    ORDER BY alm.last_msg_time DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_archived_conversations() TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify:
-- SELECT * FROM get_my_conversation_settings();
-- SELECT * FROM get_unified_conversations();
-- SELECT * FROM get_archived_conversations();
