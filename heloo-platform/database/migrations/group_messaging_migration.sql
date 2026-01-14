-- ============================================
-- He'loo Platform - Group Messaging Migration
-- Created: 2025-12-14
-- Features: Add group_id to messages for group chat support
-- ============================================

-- ============================================
-- PART 1: SCHEMA CHANGES
-- ============================================

-- 1.1: Add group_id column to messages table
-- This references the groups table with CASCADE delete
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 1.2: Make receiver_id nullable for group messages
-- First, drop any NOT NULL constraint on receiver_id
ALTER TABLE public.messages 
ALTER COLUMN receiver_id DROP NOT NULL;

-- 1.3: Add check constraint to ensure message is EITHER DM OR Group (not both, not neither)
-- Drop if exists first to make migration idempotent
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_dm_or_group_check;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_dm_or_group_check 
CHECK (
    (receiver_id IS NOT NULL AND group_id IS NULL) OR 
    (receiver_id IS NULL AND group_id IS NOT NULL)
);

-- ============================================
-- PART 2: PERFORMANCE INDEXES
-- ============================================

-- Index for group_id for efficient group message queries
CREATE INDEX IF NOT EXISTS messages_group_id_idx 
ON public.messages(group_id) 
WHERE group_id IS NOT NULL;

-- Compound index for group messages by time
CREATE INDEX IF NOT EXISTS messages_group_id_created_at_idx 
ON public.messages(group_id, created_at DESC) 
WHERE group_id IS NOT NULL;

-- ============================================
-- PART 3: UPDATE EXISTING RLS POLICIES
-- ============================================

-- 3.1: Drop existing policies that need updating
DROP POLICY IF EXISTS "Users can read their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can manage their messages" ON public.messages;

-- 3.2: Create updated SELECT policy (DMs + Group messages)
CREATE POLICY "Users can read their messages"
ON public.messages FOR SELECT TO authenticated
USING (
    -- DM messages: user is sender or receiver
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    OR
    -- Group messages: user is a member of the group
    (
        group_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = messages.group_id 
            AND gm.user_id = auth.uid()
        )
    )
);

-- 3.3: Create updated INSERT policy (DMs + Group messages)
CREATE POLICY "Users can insert their messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
    -- Must be the sender
    sender_id = auth.uid()
    AND (
        -- DM: receiver_id is set, group_id is null
        (receiver_id IS NOT NULL AND group_id IS NULL)
        OR
        -- Group: group_id is set, must be a member
        (
            group_id IS NOT NULL 
            AND receiver_id IS NULL
            AND EXISTS (
                SELECT 1 FROM public.group_members gm 
                WHERE gm.group_id = messages.group_id 
                AND gm.user_id = auth.uid()
            )
        )
    )
);

-- 3.4: Create updated UPDATE policy (for edit/delete features)
CREATE POLICY "Users can manage their messages"
ON public.messages FOR UPDATE TO authenticated
USING (
    -- DMs: user is sender or receiver
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    OR
    -- Groups: user is a member (for deleted_for updates)
    (
        group_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = messages.group_id 
            AND gm.user_id = auth.uid()
        )
    )
)
WITH CHECK (
    -- Same conditions for write
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    OR
    (
        group_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = messages.group_id 
            AND gm.user_id = auth.uid()
        )
    )
);

-- ============================================
-- PART 4: RPC FUNCTIONS FOR GROUP MESSAGING
-- ============================================

-- 4.1: Function to send a group message
CREATE OR REPLACE FUNCTION public.send_group_message(
    p_group_id UUID,
    p_content TEXT,
    p_media_url TEXT DEFAULT NULL,
    p_media_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_message_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Validate user is a member of the group
    IF NOT EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this group';
    END IF;
    
    -- Validate content
    IF p_content IS NULL OR trim(p_content) = '' THEN
        IF p_media_url IS NULL THEN
            RAISE EXCEPTION 'Message content or media is required';
        END IF;
    END IF;
    
    -- Insert the message
    INSERT INTO public.messages (
        sender_id,
        receiver_id,
        group_id,
        content,
        media_url,
        media_type,
        status
    ) VALUES (
        v_user_id,
        NULL,  -- No receiver for group messages
        p_group_id,
        COALESCE(trim(p_content), ''),
        p_media_url,
        p_media_type,
        'sent'
    )
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$;

-- 4.2: Function to fetch group messages
CREATE OR REPLACE FUNCTION public.get_group_messages(
    p_group_id UUID,
    p_limit INT DEFAULT 50,
    p_before_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    sender_id UUID,
    group_id UUID,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMPTZ,
    status TEXT,
    is_edited BOOLEAN,
    is_unsent BOOLEAN,
    deleted_for UUID[],
    sender_name TEXT,
    sender_avatar TEXT,
    sender_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Validate user is a member of the group
    IF NOT EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this group';
    END IF;
    
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        m.group_id,
        CASE WHEN m.is_unsent THEN 'This message was deleted' ELSE m.content END,
        CASE WHEN m.is_unsent THEN NULL ELSE m.media_url END,
        CASE WHEN m.is_unsent THEN NULL ELSE m.media_type END,
        m.created_at,
        m.status,
        m.is_edited,
        m.is_unsent,
        m.deleted_for,
        p.full_name AS sender_name,
        p.avatar_url AS sender_avatar,
        p.username AS sender_username
    FROM public.messages m
    LEFT JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.group_id = p_group_id
      AND NOT (v_user_id = ANY(m.deleted_for))
      AND (p_before_timestamp IS NULL OR m.created_at < p_before_timestamp)
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 4.3: Update delete_message_for_me to handle group messages
CREATE OR REPLACE FUNCTION public.delete_message_for_me(message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    rows_affected INT;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    UPDATE public.messages m
    SET deleted_for = array_append(deleted_for, v_user_id)
    WHERE 
        m.id = message_id 
        AND NOT (v_user_id = ANY(m.deleted_for))
        AND (
            -- DM: user is sender or receiver
            m.sender_id = v_user_id OR m.receiver_id = v_user_id
            OR
            -- Group: user is a member
            (
                m.group_id IS NOT NULL 
                AND EXISTS (
                    SELECT 1 FROM public.group_members gm 
                    WHERE gm.group_id = m.group_id AND gm.user_id = v_user_id
                )
            )
        );
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- ============================================
-- PART 5: UPDATE get_unified_conversations
-- ============================================

-- This function returns both DM and Group conversations in a unified format
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
    -- For DMs only
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
    -- DM Conversations
    WITH dm_partners AS (
        SELECT DISTINCT
            CASE
                WHEN m.sender_id = v_user_id THEN m.receiver_id
                ELSE m.sender_id
            END AS partner_id
        FROM public.messages m
        WHERE m.receiver_id IS NOT NULL  -- DM messages only
          AND (m.sender_id = v_user_id OR m.receiver_id = v_user_id)
          AND NOT (v_user_id = ANY(m.deleted_for))
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
        FROM dm_partners dp
        JOIN public.profiles p ON p.id = dp.partner_id
        LEFT JOIN dm_last_messages dlm ON dlm.partner_id = dp.partner_id
    ),
    -- Group Conversations
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
    -- Union both types
    SELECT * FROM dm_conversations
    UNION ALL
    SELECT * FROM group_conversations
    ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

-- ============================================
-- PART 6: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.send_group_message(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_messages(UUID, INT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unified_conversations() TO authenticated;

-- ============================================
-- PART 7: VERIFICATION COMMENTS
-- ============================================

COMMENT ON COLUMN public.messages.group_id IS 'Reference to groups table for group messages. NULL for DMs.';
COMMENT ON CONSTRAINT messages_dm_or_group_check ON public.messages IS 'Ensures message is either DM (receiver_id set) or Group (group_id set), never both.';
