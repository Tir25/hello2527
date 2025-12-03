-- ============================================
-- He'loo Platform Database Schema
-- ============================================
-- This migration creates:
-- 1. Public profiles table
-- 2. Trigger function to auto-create profiles on signup
-- 3. RLS policies for profiles
-- 4. Storage bucket for avatars
-- 5. RLS policies for storage
-- ============================================

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'Hey there! I am using He''loo',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- ============================================
-- 2. CREATE TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        username
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        -- Generate a default username from email if not provided
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            LOWER(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)) || '_' || SUBSTRING(NEW.id::TEXT, 1, 8)
        )
    );
    RETURN NEW;
END;
$$;

-- ============================================
-- 3. CREATE TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES FOR PROFILES
-- ============================================

-- Policy 1: Public profiles are viewable by everyone (authenticated users)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for manual creation if needed)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- 6. CREATE STORAGE BUCKET FOR AVATARS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================
-- 7. CREATE RLS POLICIES FOR STORAGE
-- ============================================

-- Policy 1: Anyone can view/select avatar images (public bucket)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

-- Policy 2: Authenticated users can upload images (restricted to their own folder)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Policy 3: Users can update their own images
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Policy 4: Users can delete their own images
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- ============================================
-- 8. CREATE HELPER FUNCTION FOR AVATAR URL
-- ============================================
CREATE OR REPLACE FUNCTION public.get_avatar_url(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avatar_path TEXT;
BEGIN
    SELECT name INTO avatar_path
    FROM storage.objects
    WHERE bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = user_id::TEXT
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF avatar_path IS NOT NULL THEN
        RETURN (SELECT public_url FROM storage.objects WHERE name = avatar_path AND bucket_id = 'avatars');
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- VERIFICATION QUERIES:
-- 
-- 1. Check profiles table structure:
--    SELECT * FROM information_schema.columns WHERE table_name = 'profiles';
--
-- 2. Check RLS policies:
--    SELECT * FROM pg_policies WHERE tablename = 'profiles';
--
-- 3. Check storage bucket:
--    SELECT * FROM storage.buckets WHERE id = 'avatars';
--
-- 4. Check storage policies:
--    SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
--
-- ============================================

