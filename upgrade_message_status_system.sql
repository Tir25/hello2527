-- ============================================
-- He'loo Platform - Message Status System Upgrade
-- ============================================
-- This migration upgrades the messaging system to support:
-- "Sent -> Delivered -> Seen" status flow
-- ============================================

-- ============================================
-- PART 1: SCHEMA UPDATES
-- ============================================

-- Step 1: Remove is_read column if it exists
ALTER TABLE public.messages 
DROP COLUMN IF EXISTS is_read;

-- Step 2: Add status column with check constraint
-- First add the column as nullable with default
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Update existing rows to have 'sent' status if they don't have one
UPDATE public.messages 
SET status = 'sent' 
WHERE status IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE public.messages 
ALTER COLUMN status SET NOT NULL;

-- Add the check constraint (drop if exists first to avoid errors)
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_status_check;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_status_check 
CHECK (status IN ('sent', 'delivered', 'seen'));

-- Step 3: Add delivered_at timestamp column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Step 4: Add seen_at timestamp column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- ============================================
-- PART 2: RPC FUNCTIONS FOR BULK UPDATES
-- ============================================

-- Function 1: Mark messages as delivered for a user
CREATE OR REPLACE FUNCTION public.mark_messages_delivered(user_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_message_ids UUID[];
BEGIN
    -- Update messages and collect IDs
    WITH updated AS (
        UPDATE public.messages
        SET 
            status = 'delivered',
            delivered_at = NOW()
        WHERE 
            receiver_id = user_id 
            AND status = 'sent'
        RETURNING id
    )
    SELECT ARRAY_AGG(id) INTO updated_message_ids
    FROM updated;
    
    -- Return the array of updated message IDs
    RETURN COALESCE(updated_message_ids, ARRAY[]::UUID[]);
END;
$$;

-- Function 2: Mark messages as seen between two users
CREATE OR REPLACE FUNCTION public.mark_messages_seen(
    sender_id_param UUID,
    receiver_id_param UUID
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_message_ids UUID[];
BEGIN
    -- Update messages and collect IDs
    WITH updated AS (
        UPDATE public.messages
        SET 
            status = 'seen',
            seen_at = NOW()
        WHERE 
            sender_id = sender_id_param
            AND receiver_id = receiver_id_param
            AND status != 'seen'
        RETURNING id
    )
    SELECT ARRAY_AGG(id) INTO updated_message_ids
    FROM updated;
    
    -- Return the array of updated message IDs
    RETURN COALESCE(updated_message_ids, ARRAY[]::UUID[]);
END;
$$;

-- ============================================
-- PART 3: INDEXING FOR PERFORMANCE
-- ============================================

-- Composite index for status and receiver_id queries (used in mark_messages_delivered)
CREATE INDEX IF NOT EXISTS messages_status_receiver_idx 
ON public.messages(status, receiver_id)
WHERE status = 'sent';

-- Composite index for sender_id, receiver_id, and status queries (used in mark_messages_seen)
CREATE INDEX IF NOT EXISTS messages_sender_receiver_status_idx 
ON public.messages(sender_id, receiver_id, status)
WHERE status != 'seen';

-- Index on status for general status filtering
CREATE INDEX IF NOT EXISTS messages_status_idx 
ON public.messages(status);

-- ============================================
-- PART 4: UPDATE RLS POLICIES (if needed)
-- ============================================

-- Update the existing UPDATE policy to allow status updates
-- Note: The existing policy should already allow updates for receivers
-- We may need to ensure it allows status column updates

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

-- Create new policy that allows receivers to update status-related columns
CREATE POLICY "Users can update message status"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Grant execute permissions on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_messages_delivered(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_seen(UUID, UUID) TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- VERIFICATION QUERIES:
-- 
-- 1. Check messages table structure:
--    SELECT column_name, data_type, is_nullable, column_default 
--    FROM information_schema.columns 
--    WHERE table_name = 'messages' AND table_schema = 'public'
--    ORDER BY ordinal_position;
--
-- 2. Test mark_messages_delivered function:
--    SELECT * FROM public.mark_messages_delivered('<receiver_user_id>');
--
-- 3. Test mark_messages_seen function:
--    SELECT * FROM public.mark_messages_seen('<sender_user_id>', '<receiver_user_id>');
--
-- 4. Check indexes:
--    SELECT indexname, indexdef 
--    FROM pg_indexes 
--    WHERE tablename = 'messages';
--
-- 5. Verify status constraint:
--    SELECT conname, pg_get_constraintdef(oid) 
--    FROM pg_constraint 
--    WHERE conrelid = 'public.messages'::regclass 
--    AND conname LIKE '%status%';
--
-- ============================================

