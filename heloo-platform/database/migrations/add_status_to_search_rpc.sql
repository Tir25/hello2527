-- ============================================
-- Migration: Add status field to get_public_profile_data RPC
-- ============================================
-- Purpose: Include the user's bio/status in search results for preview
-- Date: 2024-12-28
-- ============================================

-- Drop and recreate the function to include status field
CREATE OR REPLACE FUNCTION public.get_public_profile_data(search_query TEXT, current_user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    username TEXT,
    avatar_url TEXT,
    status TEXT,  -- Added: Bio/status text for preview
    has_relationship BOOLEAN,
    relationship_status TEXT,
    is_pending_outgoing BOOLEAN,
    is_pending_incoming BOOLEAN,
    am_i_following BOOLEAN,
    is_following_me BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.username,
        p.avatar_url,
        p.status,  -- Bio/status preview
        -- Check if relationship exists
        EXISTS(
            SELECT 1 
            FROM public.relationships r
            WHERE r.status = 'accepted'
            AND (
                (r.requester_id = current_user_id AND r.recipient_id = p.id)
                OR
                (r.requester_id = p.id AND r.recipient_id = current_user_id)
            )
        ) AS has_relationship,
        -- Get relationship status if exists
        COALESCE(
            (SELECT r.status 
             FROM public.relationships r
             WHERE (
                 (r.requester_id = current_user_id AND r.recipient_id = p.id)
                 OR
                 (r.requester_id = p.id AND r.recipient_id = current_user_id)
             )
             LIMIT 1),
            'none'::TEXT
        ) AS relationship_status,
        -- Check if current user sent pending request to this profile
        EXISTS(
            SELECT 1 
            FROM public.relationships r
            WHERE r.status = 'pending'
            AND r.requester_id = current_user_id 
            AND r.recipient_id = p.id
        ) AS is_pending_outgoing,
        -- Check if this profile sent pending request to current user
        EXISTS(
            SELECT 1 
            FROM public.relationships r
            WHERE r.status = 'pending'
            AND r.requester_id = p.id 
            AND r.recipient_id = current_user_id
        ) AS is_pending_incoming,
        -- Check if current user follows this profile (accepted outgoing)
        EXISTS(
            SELECT 1 
            FROM public.relationships r
            WHERE r.status = 'accepted'
            AND r.requester_id = current_user_id 
            AND r.recipient_id = p.id
        ) AS am_i_following,
        -- Check if this profile follows current user (accepted incoming)
        EXISTS(
            SELECT 1 
            FROM public.relationships r
            WHERE r.status = 'accepted'
            AND r.requester_id = p.id 
            AND r.recipient_id = current_user_id
        ) AS is_following_me
    FROM public.profiles p
    WHERE p.id != current_user_id
    AND (
        p.full_name ILIKE '%' || search_query || '%'
        OR p.username ILIKE '%' || search_query || '%'
        OR p.email ILIKE '%' || search_query || '%'
    )
    ORDER BY p.full_name NULLS LAST
    LIMIT 20;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile_data(TEXT, UUID) TO authenticated;

-- ============================================
-- Verification:
-- Run: SELECT * FROM public.get_public_profile_data('test', '<your_user_id>');
-- Should now include status field with bio/status text
-- ============================================
