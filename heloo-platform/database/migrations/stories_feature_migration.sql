-- ================================================
-- STORIES FEATURE MIGRATION
-- Run this in Supabase SQL Editor
-- ================================================

-- Core stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Media
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  duration_seconds SMALLINT DEFAULT 5,
  
  -- Music (optional)
  music_url TEXT,
  music_title TEXT,
  
  -- Caption
  caption TEXT CHECK (LENGTH(caption) <= 200),
  
  -- Timing
  posted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  
  -- Denormalized
  view_count INT DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
-- Fixed: Removed incompatible partial index condition (now() is not immutable)
CREATE INDEX IF NOT EXISTS idx_stories_feed ON stories(user_id, expires_at); 
CREATE INDEX IF NOT EXISTS idx_stories_cleanup ON stories(expires_at);

-- View tracking
CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

-- Reactions
CREATE TABLE IF NOT EXISTS story_reactions (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT CHECK (LENGTH(emoji) <= 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Stories: Users see their own + friends' non-expired stories
-- Modified to use 'relationships' table
CREATE POLICY stories_select ON stories FOR SELECT USING (
  user_id = auth.uid() 
  OR (
    expires_at > now() 
    AND EXISTS (
      SELECT 1 FROM relationships 
      WHERE status = 'accepted'
      AND ((requester_id = auth.uid() AND recipient_id = stories.user_id)
        OR (recipient_id = auth.uid() AND requester_id = stories.user_id))
    )
  )
);

-- Stories: Users can insert their own
CREATE POLICY stories_insert ON stories FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Stories: Users can delete their own
CREATE POLICY stories_delete ON stories FOR DELETE 
USING (user_id = auth.uid());

-- Views: Anyone can insert (track their view)
CREATE POLICY views_insert ON story_views FOR INSERT 
WITH CHECK (viewer_id = auth.uid());

-- Views: Story owner can see who viewed
CREATE POLICY views_select ON story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
);

-- Reactions: Users can insert their own
CREATE POLICY reactions_insert ON story_reactions FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Reactions: Anyone can see reactions
CREATE POLICY reactions_select ON story_reactions FOR SELECT USING (true);

-- Reactions: Users can delete their own
CREATE POLICY reactions_delete ON story_reactions FOR DELETE 
USING (user_id = auth.uid());

-- ================================================
-- STORAGE BUCKET
-- ================================================

-- Create stories bucket (run separately if needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  26214400,  -- 25 MB (conservative for free tier, max 50MB)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY storage_stories_insert ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY storage_stories_select ON storage.objects
FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY storage_stories_delete ON storage.objects
FOR DELETE USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- CLEANUP FUNCTION
-- ================================================

CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  -- Delete expired story records (cascade will handle views/reactions)
  DELETE FROM stories WHERE expires_at < now();
  
  RAISE NOTICE 'Cleaned up expired stories at %', now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_stories() TO service_role;
