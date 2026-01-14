-- Fix story_views RLS policy
-- Current policy only allows story OWNERS to see views
-- Need to also allow VIEWERS to see their own view records

-- Add policy for viewers to see their own views
CREATE POLICY views_select_own ON story_views FOR SELECT 
USING (viewer_id = auth.uid());

-- Note: This is in addition to existing views_select policy
-- which allows story owners to see all views on their stories
