-- ============================================
-- He'loo Platform - Message Management Migration
-- Created: 2025-12-07
-- Features: Edit, Unsend (Delete for Everyone), Delete for Me
-- ============================================

-- ============================================
-- PART 1: SCHEMA CHANGES
-- ============================================

-- Add is_edited column to track if message was edited
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;

-- Add is_unsent column for "delete for everyone" (soft delete)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_unsent BOOLEAN NOT NULL DEFAULT false;

-- Add deleted_for array for "delete for me" per-user deletion
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted_for UUID[] NOT NULL DEFAULT '{}';

-- ============================================
-- PART 2: PERFORMANCE INDEXES
-- ============================================

-- Index for filtering non-unsent messages (common query pattern)
CREATE INDEX IF NOT EXISTS messages_is_unsent_idx 
ON public.messages(is_unsent) 
WHERE is_unsent = false;

-- GIN index for efficient array lookups on deleted_for
CREATE INDEX IF NOT EXISTS messages_deleted_for_idx 
ON public.messages USING GIN(deleted_for);

-- Index for is_edited (optional, for analytics)
CREATE INDEX IF NOT EXISTS messages_is_edited_idx 
ON public.messages(is_edited) 
WHERE is_edited = true;

-- ============================================
-- PART 3: RLS POLICY UPDATE
-- ============================================

-- Drop any conflicting policy from previous attempts
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;

-- Create unified update policy for edit/delete features
CREATE POLICY "Users can manage their messages"
ON public.messages FOR UPDATE TO authenticated
USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
)
WITH CHECK (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- ============================================
-- PART 4: RPC FUNCTIONS
-- ============================================

-- Function 1: unsend_message (Delete for Everyone)
CREATE OR REPLACE FUNCTION public.unsend_message(message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE public.messages
    SET 
        content = 'This message was deleted',
        is_unsent = TRUE,
        media_url = NULL
    WHERE 
        id = message_id 
        AND sender_id = auth.uid()
        AND is_unsent = FALSE;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- Function 2: delete_message_for_me (Delete for Me Only)
CREATE OR REPLACE FUNCTION public.delete_message_for_me(message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE public.messages
    SET deleted_for = array_append(deleted_for, auth.uid())
    WHERE 
        id = message_id 
        AND (sender_id = auth.uid() OR receiver_id = auth.uid())
        AND NOT (auth.uid() = ANY(deleted_for));
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- Function 3: edit_message (Edit Message Content)
CREATE OR REPLACE FUNCTION public.edit_message(
    message_id UUID,
    new_content TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    rows_affected INT;
BEGIN
    -- Validate content
    IF new_content IS NULL OR trim(new_content) = '' THEN
        RETURN FALSE;
    END IF;

    UPDATE public.messages
    SET 
        content = trim(new_content),
        is_edited = TRUE
    WHERE 
        id = message_id 
        AND sender_id = auth.uid()
        AND is_unsent = FALSE;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- ============================================
-- PART 5: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.unsend_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message_for_me(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_message(UUID, TEXT) TO authenticated;

-- ============================================
-- PART 6: UPDATE get_my_conversations
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    username TEXT,
    phone TEXT,
    avatar_url TEXT,
    status TEXT,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH conversation_partners AS (
    SELECT DISTINCT
      CASE
        WHEN m.sender_id = current_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS partner_id
    FROM public.messages m
    WHERE (m.sender_id = current_user_id OR m.receiver_id = current_user_id)
      AND NOT (current_user_id = ANY(m.deleted_for))
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE
        WHEN m.sender_id = current_user_id THEN m.receiver_id
        ELSE m.sender_id
      END
    )
      CASE
        WHEN m.sender_id = current_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS partner_id,
      CASE 
        WHEN m.is_unsent THEN 'This message was deleted'
        ELSE m.content
      END AS last_msg,
      m.created_at AS last_msg_time
    FROM public.messages m
    WHERE (m.sender_id = current_user_id OR m.receiver_id = current_user_id)
      AND NOT (current_user_id = ANY(m.deleted_for))
    ORDER BY
      CASE
        WHEN m.sender_id = current_user_id THEN m.receiver_id
        ELSE m.sender_id
      END,
      m.created_at DESC
  )
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.username,
    p.phone,
    p.avatar_url,
    p.status,
    p.last_seen,
    p.created_at,
    lm.last_msg AS last_message,
    lm.last_msg_time AS last_message_time,
    0::BIGINT AS unread_count
  FROM conversation_partners cp
  JOIN public.profiles p ON p.id = cp.partner_id
  LEFT JOIN last_messages lm ON lm.partner_id = cp.partner_id
  ORDER BY lm.last_msg_time DESC NULLS LAST;
END;
$$;
