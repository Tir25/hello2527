-- ============================================
-- Search History Sync Migration
-- Applied: 2025-12-28
-- 
-- Features:
-- 1. Cloud-synced search history for /search page
-- 2. Privacy settings to disable history
-- 3. RPC functions for CRUD operations
-- ============================================

-- ============================================
-- 1. CREATE SEARCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate queries per user - update timestamp instead
    CONSTRAINT user_search_history_user_query_key UNIQUE(user_id, query)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
ON public.user_search_history(user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_searched_at 
ON public.user_search_history(user_id, searched_at DESC);

-- Enable RLS
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own search history
DROP POLICY IF EXISTS "Users can view own search history" ON public.user_search_history;
CREATE POLICY "Users can view own search history"
    ON public.user_search_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own search history
DROP POLICY IF EXISTS "Users can insert own search history" ON public.user_search_history;
CREATE POLICY "Users can insert own search history"
    ON public.user_search_history
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own search history
DROP POLICY IF EXISTS "Users can update own search history" ON public.user_search_history;
CREATE POLICY "Users can update own search history"
    ON public.user_search_history
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can delete their own search history
DROP POLICY IF EXISTS "Users can delete own search history" ON public.user_search_history;
CREATE POLICY "Users can delete own search history"
    ON public.user_search_history
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- 2. CREATE PRIVACY SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    save_search_history BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own privacy settings
DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can view own privacy settings"
    ON public.user_privacy_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own privacy settings
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can insert own privacy settings"
    ON public.user_privacy_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own privacy settings
DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can update own privacy settings"
    ON public.user_privacy_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- 3. RPC: SAVE SEARCH QUERY
-- ============================================
CREATE OR REPLACE FUNCTION public.save_search_query(search_query TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_save_history BOOLEAN;
    v_max_history INT := 20; -- Maximum searches to keep
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check privacy setting (default to TRUE if not set)
    SELECT COALESCE(save_search_history, TRUE)
    INTO v_save_history
    FROM public.user_privacy_settings
    WHERE user_id = v_user_id;
    
    -- If no setting exists, default to TRUE
    IF v_save_history IS NULL THEN
        v_save_history := TRUE;
    END IF;
    
    -- Don't save if privacy is disabled
    IF NOT v_save_history THEN
        RETURN FALSE;
    END IF;
    
    -- Trim and validate query
    IF TRIM(search_query) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Upsert: Insert or update timestamp if exists
    INSERT INTO public.user_search_history (user_id, query, searched_at)
    VALUES (v_user_id, TRIM(search_query), NOW())
    ON CONFLICT (user_id, query)
    DO UPDATE SET searched_at = NOW();
    
    -- Cleanup: Keep only the most recent N searches
    DELETE FROM public.user_search_history
    WHERE user_id = v_user_id
      AND id NOT IN (
          SELECT id FROM public.user_search_history
          WHERE user_id = v_user_id
          ORDER BY searched_at DESC
          LIMIT v_max_history
      );
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_search_query(TEXT) TO authenticated;

-- ============================================
-- 4. RPC: GET SEARCH HISTORY
-- ============================================
CREATE OR REPLACE FUNCTION public.get_search_history(result_limit INT DEFAULT 10)
RETURNS TABLE(
    id UUID,
    query TEXT,
    searched_at TIMESTAMPTZ
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
    
    -- Limit to max 50 results
    IF result_limit > 50 THEN
        result_limit := 50;
    END IF;
    
    RETURN QUERY
    SELECT h.id, h.query, h.searched_at
    FROM public.user_search_history h
    WHERE h.user_id = v_user_id
    ORDER BY h.searched_at DESC
    LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_search_history(INT) TO authenticated;

-- ============================================
-- 5. RPC: CLEAR ALL SEARCH HISTORY
-- ============================================
CREATE OR REPLACE FUNCTION public.clear_search_history()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    DELETE FROM public.user_search_history
    WHERE user_id = v_user_id;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_search_history() TO authenticated;

-- ============================================
-- 6. RPC: DELETE SINGLE SEARCH QUERY
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_search_query(query_to_delete TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    DELETE FROM public.user_search_history
    WHERE user_id = v_user_id
      AND LOWER(query) = LOWER(TRIM(query_to_delete));
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_search_query(TEXT) TO authenticated;

-- ============================================
-- 7. RPC: GET PRIVACY SETTINGS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_privacy_settings()
RETURNS TABLE(
    save_search_history BOOLEAN
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
    SELECT COALESCE(p.save_search_history, TRUE)
    FROM public.user_privacy_settings p
    WHERE p.user_id = v_user_id;
    
    -- If no row exists, return default (TRUE)
    IF NOT FOUND THEN
        RETURN QUERY SELECT TRUE;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_privacy_settings() TO authenticated;

-- ============================================
-- 8. RPC: UPDATE PRIVACY SETTINGS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_privacy_settings(
    p_save_search_history BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    INSERT INTO public.user_privacy_settings (user_id, save_search_history, updated_at)
    VALUES (v_user_id, p_save_search_history, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET 
        save_search_history = p_save_search_history,
        updated_at = NOW();
    
    -- If disabling history, optionally clear existing history
    -- (Uncomment if you want this behavior)
    -- IF NOT p_save_search_history THEN
    --     DELETE FROM public.user_search_history WHERE user_id = v_user_id;
    -- END IF;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_privacy_settings(BOOLEAN) TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- Tables created:
-- - user_search_history (stores search queries per user)
-- - user_privacy_settings (stores privacy toggles)
--
-- RPC Functions:
-- - save_search_query(TEXT) - Save a search query
-- - get_search_history(INT) - Get recent searches
-- - clear_search_history() - Delete all history
-- - delete_search_query(TEXT) - Delete single query
-- - get_privacy_settings() - Get privacy settings
-- - update_privacy_settings(BOOLEAN) - Update privacy toggle
-- ============================================
