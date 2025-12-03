-- ============================================
-- He'loo Platform - Conversations RPC Function
-- ============================================
-- This migration creates:
-- 1. get_my_conversations() RPC for fetching a user's active conversations
-- 2. Supporting index for efficient conversation lookups
-- ============================================

-- 1. PERFORMANCE INDEX FOR CONVERSATION QUERIES
-- This index optimizes lookups by (sender_id, receiver_id, created_at)
CREATE INDEX IF NOT EXISTS messages_user_conversations_idx
ON public.messages (sender_id, receiver_id, created_at DESC);

-- 2. get_my_conversations() FUNCTION
-- Returns all users that the current authenticated user has exchanged
-- messages with, along with last message content/timestamp and unread count.

CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
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
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();

  -- If there is no authenticated user, return no rows
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH conversation_partners AS (
    -- Get all unique users the current user has exchanged messages with
    SELECT DISTINCT
      CASE
        WHEN m.sender_id = current_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS partner_id
    FROM public.messages m
    WHERE m.sender_id = current_user_id
       OR m.receiver_id = current_user_id
  ),
  last_messages AS (
    -- Get the most recent message for each conversation partner
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
      m.content AS last_msg,
      m.created_at AS last_msg_time
    FROM public.messages m
    WHERE m.sender_id = current_user_id
       OR m.receiver_id = current_user_id
    ORDER BY
      CASE
        WHEN m.sender_id = current_user_id THEN m.receiver_id
        ELSE m.sender_id
      END,
      m.created_at DESC
  ),
  unread_counts AS (
    -- Count unread messages from each partner
    SELECT
      m.sender_id AS partner_id,
      COUNT(*) AS unread
    FROM public.messages m
    WHERE m.receiver_id = current_user_id
      AND m.is_read = false
    GROUP BY m.sender_id
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
    COALESCE(uc.unread, 0) AS unread_count
  FROM conversation_partners cp
  JOIN public.profiles p ON p.id = cp.partner_id
  LEFT JOIN last_messages lm ON lm.partner_id = cp.partner_id
  LEFT JOIN unread_counts uc ON uc.partner_id = cp.partner_id
  ORDER BY lm.last_msg_time DESC NULLS LAST;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_conversations() TO authenticated;

-- ============================================
-- VERIFICATION:
--   SELECT * FROM public.get_my_conversations();
-- ============================================


