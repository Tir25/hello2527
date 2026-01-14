-- ============================================
-- PRODUCTION FIX: Optimize Message Status RPC Performance
-- ============================================
-- 
-- Issue: mark_messages_seen RPC taking 600-1700ms for single messages
-- Root Cause: Missing or inefficient indexes, full table scans
-- Solution: Add targeted indexes and optimize RPC functions
--
-- Expected improvement: 600-1700ms → 10-50ms
--
-- Run this migration in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: CREATE OPTIMIZED INDEXES
-- ============================================

-- Index for mark_messages_seen queries
-- Covers: sender_id = ? AND receiver_id = ? AND status != 'seen'
CREATE INDEX IF NOT EXISTS idx_messages_seen_lookup
ON public.messages(sender_id, receiver_id)
WHERE status IN ('sent', 'delivered');

-- Index for mark_messages_delivered queries
-- Covers: receiver_id = ? AND status = 'sent'
CREATE INDEX IF NOT EXISTS idx_messages_delivered_lookup
ON public.messages(receiver_id)
WHERE status = 'sent';

-- Composite index for conversation queries
-- Covers: OR conditions for sender/receiver lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON public.messages(sender_id, receiver_id, created_at DESC);

-- Index for status-based filtering (general)
CREATE INDEX IF NOT EXISTS idx_messages_status_partial
ON public.messages(status)
WHERE status IN ('sent', 'delivered');

-- ============================================
-- PART 2: OPTIMIZE mark_messages_seen RPC
-- ============================================

-- Drop existing function to recreate with optimizations
DROP FUNCTION IF EXISTS mark_messages_seen(uuid, uuid);

-- Recreate with optimized query
CREATE OR REPLACE FUNCTION mark_messages_seen(
    sender_id_param UUID,
    receiver_id_param UUID
)
RETURNS TABLE (id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Use CTE with explicit index hints via column order
    -- The index idx_messages_seen_lookup covers (sender_id, receiver_id) WHERE status IN ('sent', 'delivered')
    RETURN QUERY
    WITH messages_to_update AS (
        SELECT m.id
        FROM messages m
        WHERE m.sender_id = sender_id_param
          AND m.receiver_id = receiver_id_param
          AND m.status IN ('sent', 'delivered')
        FOR UPDATE SKIP LOCKED  -- Prevent blocking on concurrent updates
    )
    UPDATE messages
    SET 
        status = 'seen',
        seen_at = NOW()
    FROM messages_to_update
    WHERE messages.id = messages_to_update.id
    RETURNING 
        messages.id,
        messages.status;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_messages_seen(UUID, UUID) TO authenticated;

-- ============================================
-- PART 3: OPTIMIZE mark_messages_delivered RPC
-- ============================================

-- Drop existing function to recreate with optimizations
DROP FUNCTION IF EXISTS mark_messages_delivered(uuid);

-- Recreate with optimized query
CREATE OR REPLACE FUNCTION mark_messages_delivered(
    user_id UUID
)
RETURNS TABLE (id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Use the idx_messages_delivered_lookup index
    RETURN QUERY
    WITH messages_to_update AS (
        SELECT m.id
        FROM messages m
        WHERE m.receiver_id = user_id
          AND m.status = 'sent'
        FOR UPDATE SKIP LOCKED
    )
    UPDATE messages
    SET 
        status = 'delivered',
        delivered_at = NOW()
    FROM messages_to_update
    WHERE messages.id = messages_to_update.id
    RETURNING 
        messages.id,
        messages.status;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_messages_delivered(UUID) TO authenticated;

-- ============================================
-- PART 4: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update table statistics for optimal query planning
ANALYZE messages;

-- ============================================
-- PART 5: VERIFY INDEX USAGE (Manual Check)
-- ============================================

-- Run these queries manually to verify indexes are being used:
/*
-- Check mark_messages_seen query plan
EXPLAIN ANALYZE 
SELECT id FROM messages 
WHERE sender_id = 'test-uuid' 
  AND receiver_id = 'test-uuid' 
  AND status IN ('sent', 'delivered');

-- Check mark_messages_delivered query plan
EXPLAIN ANALYZE 
SELECT id FROM messages 
WHERE receiver_id = 'test-uuid' 
  AND status = 'sent';

-- Expected: "Index Scan" or "Index Only Scan" in the output
-- Bad: "Seq Scan" (sequential scan = full table scan)
*/

-- ============================================
-- PART 6: COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION mark_messages_seen(UUID, UUID) IS 
'Optimized RPC to mark messages as seen. Uses partial index for fast lookups. 
Expected performance: 10-50ms for typical workloads.';

COMMENT ON FUNCTION mark_messages_delivered(UUID) IS 
'Optimized RPC to mark messages as delivered. Uses partial index for fast lookups.
Expected performance: 10-50ms for typical workloads.';

COMMENT ON INDEX idx_messages_seen_lookup IS 
'Partial index for mark_messages_seen queries. Covers sender_id + receiver_id WHERE status NOT seen.';

COMMENT ON INDEX idx_messages_delivered_lookup IS 
'Partial index for mark_messages_delivered queries. Covers receiver_id WHERE status = sent.';

-- ============================================
-- VERIFICATION STEPS
-- ============================================
/*
After running this migration:

1. Test mark_messages_seen performance:
   SELECT * FROM mark_messages_seen('sender-uuid', 'receiver-uuid');
   -- Should complete in < 50ms

2. Test mark_messages_delivered performance:
   SELECT * FROM mark_messages_delivered('user-uuid');
   -- Should complete in < 50ms

3. Check console logs in application:
   - Look for: [WARN] [useMessageStatus:performance] Slow RPC call
   - Should no longer appear (threshold is 500ms)

4. Monitor Supabase dashboard:
   - Database → Performance → Queries
   - Look for queries on `messages` table
   - Verify average execution time < 100ms
*/
