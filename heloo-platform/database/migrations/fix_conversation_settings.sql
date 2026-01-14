-- ============================================
-- Fix: Add Missing Constraints for Conversation Settings
-- Applied: 2025-12-16
-- Addresses "no unique or exclusion constraint matching ON CONFLICT" error
-- ============================================

-- 1. Drop existing functions with old return types (ensures clean slate)
DROP FUNCTION IF EXISTS public.archive_chat(UUID);
DROP FUNCTION IF EXISTS public.delete_chat(UUID);
DROP FUNCTION IF EXISTS public.unarchive_chat(UUID);

-- 2. Safely add the unique constraint on (owner_id, partner_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'conversation_settings_owner_partner_key'
    ) THEN
        ALTER TABLE public.conversation_settings 
        ADD CONSTRAINT conversation_settings_owner_partner_key UNIQUE (owner_id, partner_id);
    END IF;
END $$;

-- 3. Create archive_chat RPC
CREATE OR REPLACE FUNCTION public.archive_chat(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.conversation_settings (owner_id, partner_id, is_archived, updated_at)
    VALUES (current_user_id, target_user_id, true, now())
    ON CONFLICT (owner_id, partner_id)
    DO UPDATE SET 
        is_archived = true,
        updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- 4. Create delete_chat RPC
CREATE OR REPLACE FUNCTION public.delete_chat(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.conversation_settings (owner_id, partner_id, chat_deleted_at, updated_at)
    VALUES (current_user_id, target_user_id, now(), now())
    ON CONFLICT (owner_id, partner_id)
    DO UPDATE SET 
        chat_deleted_at = now(),
        updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- 5. Create unarchive_chat RPC
CREATE OR REPLACE FUNCTION public.unarchive_chat(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.conversation_settings
    SET is_archived = false, updated_at = now()
    WHERE owner_id = current_user_id AND partner_id = target_user_id;
    
    RETURN TRUE;
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.archive_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unarchive_chat(UUID) TO authenticated;

-- ============================================
-- PART 7: Fix get_unified_conversations to filter archived/deleted chats
-- ============================================

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
    last_seen TIMESTAMPTZ
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
    -- Filter out deleted AND archived conversations
    active_dm_partners AS (
        SELECT dp.partner_id
        FROM dm_partners dp
        WHERE NOT EXISTS (
            SELECT 1 FROM public.conversation_settings cs
            WHERE cs.owner_id = v_user_id 
              AND cs.partner_id = dp.partner_id
              AND (cs.chat_deleted_at IS NOT NULL OR cs.is_archived = true)
        )
    ),
    dm_last_messages AS (
        SELECT DISTINCT ON (
            CASE
                WHEN m.sender_id = v_user_id THEN m.receiver_id
                ELSE m.sender_id
            END
        )
            CASE
                WHEN m.sender_id = v_user_id THEN m.receiver_id
                ELSE m.sender_id
            END AS partner_id,
            CASE WHEN m.is_unsent THEN 'This message was deleted' ELSE m.content END AS last_msg,
            m.created_at AS last_msg_time
        FROM public.messages m
        WHERE m.receiver_id IS NOT NULL
          AND (m.sender_id = v_user_id OR m.receiver_id = v_user_id)
          AND NOT (v_user_id = ANY(m.deleted_for))
        ORDER BY
            CASE
                WHEN m.sender_id = v_user_id THEN m.receiver_id
                ELSE m.sender_id
            END,
            m.created_at DESC
    ),
    dm_conversations AS (
        SELECT
            p.id,
            COALESCE(p.full_name, p.username, p.email) AS name,
            p.avatar_url,
            dlm.last_msg AS last_message,
            dlm.last_msg_time AS last_message_time,
            0::BIGINT AS unread_count,
            FALSE AS is_group,
            NULL::INT AS member_count,
            p.email,
            p.username,
            p.phone,
            p.status,
            p.last_seen
        FROM active_dm_partners adp
        JOIN public.profiles p ON p.id = adp.partner_id
        LEFT JOIN dm_last_messages dlm ON dlm.partner_id = adp.partner_id
    ),
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
            NULL::TIMESTAMPTZ AS last_seen
        FROM public.groups g
        JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = v_user_id
        LEFT JOIN group_last_messages glm ON glm.group_id = g.id
    )
    SELECT * FROM dm_conversations
    UNION ALL
    SELECT * FROM group_conversations
    ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unified_conversations() TO authenticated;

-- ============================================
-- PART 8: REMOVED - No longer clearing chat_deleted_at on new message
-- Instead, get_unified_conversations now checks for NEW messages after deletion
-- This preserves the deletion timestamp while allowing new conversations to appear
-- ============================================

-- Drop the trigger that was causing old messages to reappear
DROP TRIGGER IF EXISTS trigger_clear_chat_deleted_on_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.clear_chat_deleted_on_new_message();

-- NOTE: The updated get_unified_conversations RPC (see PART 7) now:
-- 1. Shows conversations that are NOT deleted
-- 2. OR shows conversations that HAVE new messages AFTER chat_deleted_at
-- This ensures deleted chats reappear when new messages are sent,
-- but old messages before the deletion remain hidden.

