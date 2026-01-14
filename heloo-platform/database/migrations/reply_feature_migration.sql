-- ============================================
-- He'loo Platform - Reply/Quote Feature Migration
-- Created: 2025-12-24
-- Features: Add reply_to_id column to messages for message replies
-- ============================================

-- ============================================
-- PART 1: SCHEMA CHANGES
-- ============================================

-- 1.1: Add reply_to_id column to messages table
-- This references another message in the same table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- 1.2: Create index for efficient reply lookups
CREATE INDEX IF NOT EXISTS messages_reply_to_id_idx 
ON public.messages(reply_to_id) 
WHERE reply_to_id IS NOT NULL;

-- ============================================
-- PART 2: UPDATE SEND GROUP MESSAGE FUNCTION
-- ============================================

-- ============================================
-- PART 2: UPDATE SEND GROUP MESSAGE FUNCTION
-- ============================================

-- Drop old function signature to avoid overloads
DROP FUNCTION IF EXISTS public.send_group_message(UUID, TEXT, TEXT, TEXT, UUID[]);

-- Update send_group_message to support reply_to_id AND mentions
CREATE OR REPLACE FUNCTION public.send_group_message(
    p_group_id UUID,
    p_content TEXT,
    p_media_url TEXT DEFAULT NULL,
    p_media_type TEXT DEFAULT NULL,
    p_mentions UUID[] DEFAULT '{}'::uuid[],
    p_reply_to_id UUID DEFAULT NULL
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
        reply_to_id,
        mentions,
        status
    ) VALUES (
        v_user_id,
        NULL,  -- No receiver for group messages
        p_group_id,
        COALESCE(trim(p_content), ''),
        p_media_url,
        p_media_type,
        p_reply_to_id,
        p_mentions,
        'sent'
    )
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$;

-- ============================================
-- PART 3: UPDATE GET GROUP MESSAGES FUNCTION
-- ============================================

-- Drop old function to allow return type change
DROP FUNCTION IF EXISTS public.get_group_messages(UUID, INT, TIMESTAMPTZ);

-- Update get_group_messages to include reply data and mentions
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
    mentions UUID[],
    sender_name TEXT,
    sender_avatar TEXT,
    sender_username TEXT,
    reply_to_id UUID,
    reply_to_content TEXT,
    reply_to_sender_id UUID,
    reply_to_sender_name TEXT,
    reply_to_media_type TEXT
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
        m.mentions,
        p.full_name AS sender_name,
        p.avatar_url AS sender_avatar,
        p.username AS sender_username,
        -- Reply data
        m.reply_to_id,
        CASE WHEN rm.is_unsent THEN 'This message was deleted' ELSE rm.content END AS reply_to_content,
        rm.sender_id AS reply_to_sender_id,
        rp.full_name AS reply_to_sender_name,
        rm.media_type AS reply_to_media_type
    FROM public.messages m
    LEFT JOIN public.profiles p ON p.id = m.sender_id
    LEFT JOIN public.messages rm ON rm.id = m.reply_to_id
    LEFT JOIN public.profiles rp ON rp.id = rm.sender_id
    WHERE m.group_id = p_group_id
      AND NOT (v_user_id = ANY(m.deleted_for))
      AND (p_before_timestamp IS NULL OR m.created_at < p_before_timestamp)
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- PART 4: UPDATE GET THREAD MESSAGES FUNCTION
-- ============================================

-- Drop old function to allow return type change
DROP FUNCTION IF EXISTS public.get_thread_messages(UUID);

-- Update get_thread_messages to include reply data and mentions for DMs
CREATE OR REPLACE FUNCTION public.get_thread_messages(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    receiver_id UUID,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMPTZ,
    status TEXT,
    is_edited BOOLEAN,
    is_unsent BOOLEAN,
    delivered_at TIMESTAMPTZ,
    seen_at TIMESTAMPTZ,
    deleted_for UUID[],
    mentions UUID[],
    reply_to_id UUID,
    reply_to_content TEXT,
    reply_to_sender_id UUID,
    reply_to_sender_name TEXT,
    reply_to_media_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id UUID;
    v_chat_deleted_at TIMESTAMPTZ;
BEGIN
    v_current_user_id := auth.uid();
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get chat_deleted_at from conversation_settings (using correct column names)
    SELECT cs.chat_deleted_at INTO v_chat_deleted_at
    FROM public.conversation_settings cs
    WHERE cs.owner_id = v_current_user_id 
      AND cs.partner_id = target_user_id;
    
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        CASE WHEN m.is_unsent THEN 'This message was deleted' ELSE m.content END,
        CASE WHEN m.is_unsent THEN NULL ELSE m.media_url END,
        CASE WHEN m.is_unsent THEN NULL ELSE m.media_type END,
        m.created_at,
        m.status,
        m.is_edited,
        m.is_unsent,
        m.delivered_at,
        m.seen_at,
        m.deleted_for,
        m.mentions,
        -- Reply data
        m.reply_to_id,
        CASE WHEN rm.is_unsent THEN 'This message was deleted' ELSE rm.content END AS reply_to_content,
        rm.sender_id AS reply_to_sender_id,
        rp.full_name AS reply_to_sender_name,
        rm.media_type AS reply_to_media_type
    FROM public.messages m
    LEFT JOIN public.messages rm ON rm.id = m.reply_to_id
    LEFT JOIN public.profiles rp ON rp.id = rm.sender_id
    WHERE m.receiver_id IS NOT NULL
      AND (
        (m.sender_id = v_current_user_id AND m.receiver_id = target_user_id)
        OR
        (m.sender_id = target_user_id AND m.receiver_id = v_current_user_id)
      )
      AND NOT (v_current_user_id = ANY(m.deleted_for))
      AND (v_chat_deleted_at IS NULL OR m.created_at > v_chat_deleted_at)
    ORDER BY m.created_at ASC;
END;
$$;

-- ============================================
-- PART 5: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.send_group_message(UUID, TEXT, TEXT, TEXT, UUID[], UUID) TO authenticated;

-- ============================================
-- PART 6: VERIFICATION
-- ============================================

COMMENT ON COLUMN public.messages.reply_to_id IS 'Reference to another message being replied to. NULL if not a reply.';
