# Database Usage Guide
## He'loo Platform - Quick Reference

## 🔐 Authentication Flow

### Signup (Registration)
```typescript
// Your existing code already works perfectly!
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      phone: '1234567890',
    },
  },
})

// Profile is automatically created! ✅
// You can immediately query it:
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user?.id)
  .single()
```

### Login
```typescript
// Your existing code works perfectly!
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// After login, fetch profile:
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user?.id)
  .single()
```

---

## 👤 Profile Operations

### Get Current User's Profile
```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', (await supabase.auth.getUser()).data.user?.id)
  .single()
```

### Update Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    full_name: 'Jane Doe',
    username: 'janedoe',
    phone: '9876543210',
    status: 'Available',
  })
  .eq('id', (await supabase.auth.getUser()).data.user?.id)
```

### Get All Profiles (for friend list, etc.)
```typescript
// All authenticated users can view all profiles
const { data: profiles, error } = await supabase
  .from('profiles')
  .select('id, email, full_name, username, avatar_url, status, last_seen')
  .order('created_at', { ascending: false })
```

### Search Profiles by Username
```typescript
const { data: profiles, error } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', `%${searchTerm}%`)
```

---

## 🖼️ Avatar Management

### Upload Avatar
```typescript
// IMPORTANT: Upload path must be: {user_id}/filename.ext
const userId = (await supabase.auth.getUser()).data.user?.id
const file = event.target.files[0]
const fileExt = file.name.split('.').pop()
const fileName = `${userId}/avatar.${fileExt}`

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: true // Overwrites existing file
  })

if (!error) {
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)
  
  // Update profile with avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId)
}
```

### Get Avatar URL
```typescript
// Method 1: From profile
const { data: profile } = await supabase
  .from('profiles')
  .select('avatar_url')
  .eq('id', userId)
  .single()

// Method 2: Direct from storage
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)
```

### Delete Avatar
```typescript
const userId = (await supabase.auth.getUser()).data.user?.id
const { error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/avatar.jpg`])

// Also update profile
await supabase
  .from('profiles')
  .update({ avatar_url: null })
  .eq('id', userId)
```

---

## 🔍 Common Queries

### Get User Profile by Username
```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('username', 'janedoe')
  .single()
```

### Update Last Seen
```typescript
// Call this periodically or on app focus
await supabase
  .from('profiles')
  .update({ last_seen: new Date().toISOString() })
  .eq('id', (await supabase.auth.getUser()).data.user?.id)
```

### Check if Username Exists
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('username')
  .eq('username', 'desired_username')
  .single()

if (data) {
  // Username already taken
} else {
  // Username available
}
```

---

## ⚠️ Important Notes

### 1. Username Uniqueness
- The `username` column has a UNIQUE constraint
- Always check if username exists before allowing user to set it
- Handle unique constraint violations gracefully

### 2. Avatar Upload Path
- **CRITICAL:** Upload path MUST be: `{user_id}/filename.ext`
- Example: `550e8400-e29b-41d4-a716-446655440000/avatar.jpg`
- This ensures RLS policies work correctly

### 3. Profile Auto-Creation
- Profiles are automatically created on signup
- No need to manually create profiles
- If profile doesn't exist after signup, check trigger logs

### 4. RLS Policies
- Users can only UPDATE their own profile
- Users can only INSERT their own profile
- All authenticated users can SELECT all profiles
- Storage: Users can only upload/update/delete in their own folder

### 5. Foreign Key Cascade
- If a user is deleted from `auth.users`, their profile is automatically deleted
- This is handled by `ON DELETE CASCADE`

---

## 🐛 Troubleshooting

### Profile Not Created After Signup
1. Check if user was created in `auth.users`
2. Check trigger logs in Supabase dashboard
3. Verify `raw_user_meta_data` contains `full_name` and `phone`

### Cannot Update Profile
1. Verify user is authenticated: `await supabase.auth.getUser()`
2. Check if `auth.uid() = id` (user can only update own profile)
3. Verify RLS is enabled on profiles table

### Cannot Upload Avatar
1. Verify upload path format: `{user_id}/filename.ext`
2. Check file size (max 5MB)
3. Check file type (JPEG, PNG, GIF, WebP only)
4. Verify user is authenticated

### Username Already Exists Error
1. This is expected - username must be unique
2. Implement username availability check before allowing user to set it
3. Provide user-friendly error message

---

## 📊 Database Schema Reference

### Profiles Table
```sql
CREATE TABLE public.profiles (
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
```

### Storage Bucket
- **Name:** `avatars`
- **Public:** Yes
- **Max File Size:** 5MB
- **Allowed Types:** JPEG, PNG, GIF, WebP

---

## ✅ Best Practices

1. **Always check authentication** before profile operations
2. **Validate username uniqueness** before allowing user to set it
3. **Use proper avatar upload path** format: `{user_id}/filename.ext`
4. **Update last_seen** periodically for online status
5. **Handle errors gracefully** - show user-friendly messages
6. **Use indexes** - queries on `username` and `email` are optimized

---

**Your database is ready to use! 🚀**

