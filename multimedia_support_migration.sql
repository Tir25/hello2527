-- ============================================
-- He'loo Platform - Multimedia Support Migration
-- ============================================
-- This migration adds:
-- 1. Multimedia columns to messages table
-- 2. Storage bucket for chat media
-- 3. RLS policies for media storage
-- 4. Auto-cleanup cron job for old media files
-- ============================================

-- ============================================
-- PART 1: DATABASE UPDATES (MESSAGES TABLE)
-- ============================================

-- Add media_url column (nullable)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add media_type column with check constraint
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Add check constraint for media_type
-- Only allow: 'text', 'image', 'video', 'audio', 'document'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_media_type_check'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_media_type_check
        CHECK (media_type IS NULL OR media_type IN ('text', 'image', 'video', 'audio', 'document'));
    END IF;
END $$;

-- Add file_name column (nullable) - for documents to show the name
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Create index on media_type for faster queries
CREATE INDEX IF NOT EXISTS messages_media_type_idx ON public.messages(media_type) 
WHERE media_type IS NOT NULL;

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS messages_created_at_media_idx ON public.messages(created_at) 
WHERE media_type IS NOT NULL;

-- ============================================
-- PART 2: STORAGE SETUP
-- ============================================

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-media',
    'chat-media',
    true, -- Public bucket for viewing
    104857600, -- 100MB limit (adjust as needed)
    ARRAY[
        -- Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        -- Videos
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        -- Audio
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
        -- Documents
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
    ];

-- ============================================
-- PART 2: RLS POLICIES FOR STORAGE
-- ============================================

-- Policy 1: SELECT - Allow Public (or Authenticated) to view
DROP POLICY IF EXISTS "Chat media is publicly viewable" ON storage.objects;
CREATE POLICY "Chat media is publicly viewable"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'chat-media');

-- Policy 2: INSERT - Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'chat-media');

-- Policy 3: DELETE - Authenticated users can delete their own files
-- Note: We'll use the owner metadata or path structure to determine ownership
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;
CREATE POLICY "Users can delete their own chat media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'chat-media' AND
        (
            -- Allow if owner metadata matches current user
            (owner IS NOT NULL AND owner = auth.uid()::TEXT) OR
            -- OR if the path starts with user's ID
            (name LIKE auth.uid()::TEXT || '/%')
        )
    );

-- Policy 4: UPDATE - Authenticated users can update their own files
DROP POLICY IF EXISTS "Users can update their own chat media" ON storage.objects;
CREATE POLICY "Users can update their own chat media"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'chat-media' AND
        (
            (owner IS NOT NULL AND owner = auth.uid()::TEXT) OR
            (name LIKE auth.uid()::TEXT || '/%')
        )
    )
    WITH CHECK (
        bucket_id = 'chat-media' AND
        (
            (owner IS NOT NULL AND owner = auth.uid()::TEXT) OR
            (name LIKE auth.uid()::TEXT || '/%')
        )
    );

-- ============================================
-- PART 3: THE "JANITOR" (AUTO-CLEANUP CRON JOB)
-- ============================================

-- Enable pg_cron extension (if not already enabled)
-- IMPORTANT: pg_cron may not be available on Supabase Free Tier
-- If pg_cron is not available, you can:
-- 1. Use Supabase Edge Functions with a scheduled trigger (via external cron service)
-- 2. Use an external cron service (e.g., cron-job.org) to call the function via HTTP
-- 3. Upgrade to a paid tier that supports pg_cron
-- 
-- To check if pg_cron is available:
-- SELECT * FROM pg_extension WHERE extname = 'pg_cron';
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to delete old media
CREATE OR REPLACE FUNCTION public.delete_old_media()
RETURNS TABLE(deleted_count INTEGER, deleted_files TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    video_message_ids UUID[];
    non_video_message_ids UUID[];
    deleted_files_list TEXT[];
    video_count INTEGER := 0;
    non_video_count INTEGER := 0;
    msg_record RECORD;
    file_path TEXT;
    all_message_ids UUID[];
BEGIN
    -- Find video messages older than 24 hours
    SELECT ARRAY_AGG(id) INTO video_message_ids
    FROM public.messages
    WHERE media_type = 'video'
    AND created_at < NOW() - INTERVAL '24 hours'
    AND media_url IS NOT NULL;

    -- Find non-video messages older than 30 days
    SELECT ARRAY_AGG(id) INTO non_video_message_ids
    FROM public.messages
    WHERE media_type IS NOT NULL
    AND media_type != 'video'
    AND created_at < NOW() - INTERVAL '30 days'
    AND media_url IS NOT NULL;

    -- Combine all message IDs
    all_message_ids := COALESCE(video_message_ids, ARRAY[]::UUID[]) || COALESCE(non_video_message_ids, ARRAY[]::UUID[]);

    -- Initialize deleted files list
    deleted_files_list := ARRAY[]::TEXT[];

    -- Process all messages that need cleanup
    IF array_length(all_message_ids, 1) > 0 THEN
        FOR msg_record IN 
            SELECT id, media_url, media_type
            FROM public.messages 
            WHERE id = ANY(all_message_ids)
        LOOP
            -- Extract file path from media_url
            -- media_url format: https://<project>.supabase.co/storage/v1/object/public/chat-media/<path>
            -- Or: https://<project>.supabase.co/storage/v1/object/sign/chat-media/<path>
            -- We need to extract the path after 'chat-media/'
            file_path := NULL;
            
            -- Try to extract path using regex
            SELECT (regexp_match(msg_record.media_url, 'chat-media/(.+?)(?:\?|$)'))[1] INTO file_path;
            
            -- If regex didn't work, try simpler substring approach
            IF file_path IS NULL THEN
                file_path := SUBSTRING(
                    msg_record.media_url 
                    FROM 'chat-media/(.+)$'
                );
            END IF;

            -- If we found a path, delete the file from storage
            IF file_path IS NOT NULL THEN
                BEGIN
                    -- Delete from storage.objects
                    DELETE FROM storage.objects
                    WHERE bucket_id = 'chat-media'
                    AND name = file_path;
                    
                    -- Track deleted file
                    deleted_files_list := array_append(deleted_files_list, file_path);
                    
                    -- Increment counter based on media type
                    IF msg_record.media_type = 'video' THEN
                        video_count := video_count + 1;
                    ELSE
                        non_video_count := non_video_count + 1;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        -- Log error but continue processing
                        RAISE WARNING 'Failed to delete file %: %', file_path, SQLERRM;
                END;
            END IF;
        END LOOP;
    END IF;

    -- Update messages to indicate media expired
    -- Set content to "Media Expired" if content was empty, otherwise keep original
    UPDATE public.messages
    SET 
        content = CASE 
            WHEN content IS NULL OR content = '' THEN 'Media Expired'
            ELSE content
        END,
        media_url = NULL,
        media_type = NULL,
        file_name = NULL
    WHERE id = ANY(all_message_ids);

    -- Return results
    RETURN QUERY SELECT 
        (video_count + non_video_count)::INTEGER as deleted_count,
        deleted_files_list as deleted_files;
END;
$$;

-- Schedule the cleanup function to run every hour
-- Format: cron.schedule(job_name, schedule, command)
-- Schedule: '0 * * * *' means "at minute 0 of every hour"
-- 
-- NOTE: If pg_cron is not available, the function will still be created
-- and can be called manually or via external cron service
DO $$
BEGIN
    -- Check if pg_cron extension exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove existing schedule if it exists
        BEGIN
            PERFORM cron.unschedule('delete-old-media-job');
        EXCEPTION
            WHEN undefined_function THEN
                -- cron.unschedule might not exist in some versions
                NULL;
        END;

        -- Schedule the job
        PERFORM cron.schedule(
            'delete-old-media-job',
            '0 * * * *', -- Every hour at minute 0
            $$SELECT public.delete_old_media()$$
        );
        
        RAISE NOTICE 'Cron job scheduled successfully: delete-old-media-job';
    ELSE
        RAISE WARNING 'pg_cron extension not available. Function delete_old_media() created but not scheduled.';
        RAISE WARNING 'You can call it manually: SELECT * FROM public.delete_old_media();';
        RAISE WARNING 'Or set up an external cron service to call it via Supabase Edge Function.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If pg_cron is not available, log a warning
        RAISE WARNING 'Could not schedule cron job. pg_cron extension may not be enabled. Error: %', SQLERRM;
        RAISE WARNING 'Function delete_old_media() was created and can be called manually.';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- 
-- 1. Check messages table structure:
--    SELECT column_name, data_type, is_nullable, column_default 
--    FROM information_schema.columns 
--    WHERE table_name = 'messages' AND table_schema = 'public'
--    ORDER BY ordinal_position;
--
-- 2. Check storage bucket:
--    SELECT * FROM storage.buckets WHERE id = 'chat-media';
--
-- 3. Check storage policies:
--    SELECT * FROM pg_policies 
--    WHERE tablename = 'objects' AND schemaname = 'storage' 
--    AND policyname LIKE '%chat media%';
--
-- 4. Check cleanup function:
--    SELECT routine_name, routine_definition 
--    FROM information_schema.routines 
--    WHERE routine_name = 'delete_old_media';
--
-- 5. Check cron job schedule:
--    SELECT * FROM cron.job WHERE jobname = 'delete-old-media-job';
--
-- 6. Test cleanup function manually:
--    SELECT * FROM public.delete_old_media();
--
-- ============================================
-- MIGRATION COMPLETE
-- ============================================

