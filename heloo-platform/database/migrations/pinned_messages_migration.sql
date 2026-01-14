-- ============================================
-- He'loo Platform - Pinned Messages RLS Fix
-- Created: 2025-12-24
-- Objective: Allow group members/admins to pin messages
-- ================== AUDIT ====================
-- 1. is_pinned, pinned_at, pinned_by columns: ALREADY EXIST
-- 2. idx_messages_pinned, idx_messages_mentions: ALREADY EXIST
-- 3. CURRENT BLOCKER: RLS UPDATE policy is sender-only
-- ============================================

-- ============================================
-- PART 1: UPDATE RLS POLICIES FOR MESSAGES
-- ============================================

-- Drop the old restrictive update policy if it exists by name
-- Note: Checking pg_policies, the name was "Users can update their own messages"
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create an improved policy that allows:
-- A) Senders to update their own messages (edit/delete)
-- B) Group members to update the pin status of messages in their group
CREATE POLICY "Users can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (
    sender_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = messages.group_id
        AND gm.user_id = auth.uid()
    )
)
WITH CHECK (
    sender_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = messages.group_id
        AND gm.user_id = auth.uid()
    )
);

-- Note: We can add more granular logic specifically for 'role' in group_members 
-- if we only want admins to pin, but traditionally in many chats any member can pin 
-- until restricted.
