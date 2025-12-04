-- Production Fix: Update mark_messages_seen RPC to return message IDs
-- 
-- Issue: Current RPC returns NULL instead of updated message IDs
-- Fix: Add RETURNING clause with only columns that exist
--
-- Migration: Run this SQL in Supabase SQL Editor

-- Drop existing function
DROP FUNCTION IF EXISTS mark_messages_seen(uuid, uuid);

-- Recreate with proper RETURNING clause (only id and status - no updated_at)
CREATE OR REPLACE FUNCTION mark_messages_seen(
    sender_id_param UUID,
    receiver_id_param UUID
)
RETURNS TABLE (id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update messages from sender to receiver that aren't already 'seen'
    -- Note: messages table doesn't have updated_at column, so we don't set it
    RETURN QUERY
    UPDATE messages
    SET 
        status = 'seen'
    WHERE 
        messages.sender_id = sender_id_param
        AND messages.receiver_id = receiver_id_param
        AND messages.status != 'seen'
    RETURNING 
        messages.id,
        messages.status;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_seen(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION mark_messages_seen(UUID, UUID) IS 
'Marks all undelivered messages from sender to receiver as "seen" and returns the updated message IDs. Used by useMessageStatus hook.';

/*
VERIFICATION STEPS:
1. Run this migration in Supabase SQL Editor
2. Test with: SELECT * FROM mark_messages_seen('sender-uuid', 'receiver-uuid');
3. Verify response includes actual message IDs
4. Check that frontend logs show actual message IDs in "updatedMessageIds"
5. Verify no errors about missing columns

EXPECTED BEHAVIOR AFTER FIX:
Before: Errors about "updated_at does not exist"
After:  updatedMessageIds: ['msg-id-1', 'msg-id-2', ...] with no errors
*/
