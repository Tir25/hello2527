-- ================================================
-- STORIES FEATURE V2 MIGRATION
-- Add support for filters, overlays, stickers, and scheduling
-- Run this in Supabase SQL Editor
-- ================================================

DO $$ 
BEGIN
    -- 1. Add Filter Column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'filter') THEN
        ALTER TABLE stories ADD COLUMN filter TEXT DEFAULT 'none';
    END IF;

    -- 2. Add Text Overlays Column (JSONB for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'text_overlays') THEN
        ALTER TABLE stories ADD COLUMN text_overlays JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- 3. Add Stickers Column (JSONB for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'stickers') THEN
        ALTER TABLE stories ADD COLUMN stickers JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- 4. Add Scheduled Timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'scheduled_at') THEN
        ALTER TABLE stories ADD COLUMN scheduled_at TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_stories_scheduled ON stories(scheduled_at) WHERE scheduled_at IS NOT NULL;
    END IF;

END $$;
