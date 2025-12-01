-- ============================================
-- He'loo Platform - Messages Table Migration
-- ============================================
-- This migration creates:
-- 1. Messages table for real-time chat
-- 2. RLS policies for secure message access
-- 3. Indexes for optimal query performance
-- ============================================

-- ============================================
-- 1. CREATE MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
-- Composite index for conversation queries
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES FOR MESSAGES
-- ============================================

-- Policy 1: Users can select messages where they are the sender OR receiver
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Policy 2: Users can insert messages where they are the sender
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- Policy 3: Users can update message read status for messages they received
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;
CREATE POLICY "Users can mark received messages as read"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- ============================================
-- 4. ENABLE REALTIME FOR MESSAGES TABLE
-- ============================================
-- Add the messages table to the supabase_realtime publication
-- This enables real-time subscriptions for INSERT, UPDATE, DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- VERIFICATION QUERIES:
-- 
-- 1. Check messages table structure:
--    SELECT column_name, data_type, is_nullable, column_default 
--    FROM information_schema.columns 
--    WHERE table_name = 'messages' AND table_schema = 'public';
--
-- 2. Check RLS policies:
--    SELECT * FROM pg_policies WHERE tablename = 'messages';
--
-- 3. Check indexes:
--    SELECT indexname, indexdef 
--    FROM pg_indexes 
--    WHERE tablename = 'messages';
--
-- 4. Test message insertion (as authenticated user):
--    INSERT INTO public.messages (sender_id, receiver_id, content)
--    VALUES (
--        auth.uid(),
--        '<receiver_id>',
--        'Test message'
--    );
--
-- 5. Test message retrieval:
--    SELECT * FROM public.messages
--    WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
--    ORDER BY created_at ASC;
--
-- ============================================

