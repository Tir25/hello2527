# He'loo Platform - Testing Checklist

## 🔐 Authentication Testing

### Signup Flow
- [ ] Navigate to `/signup`
- [ ] Fill out form with valid data:
  - Full Name: "Test User"
  - Email: "test@example.com"
  - Phone: "1234567890"
  - Password: "password123"
  - Confirm Password: "password123"
- [ ] Submit form
- [ ] **Verify in Supabase Dashboard:**
  - [ ] User created in `auth.users` table
  - [ ] Profile created in `public.profiles` table
  - [ ] `full_name` field is populated correctly (not null)
  - [ ] `phone` field is populated correctly
  - [ ] `email` field matches signup email
  - [ ] `username` is auto-generated
- [ ] If email confirmation is enabled, verify redirect to login with success message
- [ ] If email confirmation is disabled, verify redirect to dashboard

### Login Flow
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Verify redirect to `/dashboard`
- [ ] Verify user email displays in navigation bar
- [ ] Try accessing `/login` while logged in
- [ ] Verify redirect to `/dashboard` (PublicRoute protection)

### Logout Flow
- [ ] While logged in, click "Logout" button in navigation
- [ ] Verify redirect to `/login`
- [ ] Verify session is cleared
- [ ] Try accessing `/dashboard` after logout
- [ ] Verify redirect to `/login` (ProtectedRoute protection)

### Protected Routes
- [ ] While logged out, try accessing `/dashboard`
- [ ] Verify redirect to `/login`
- [ ] While logged out, try accessing `/profile`
- [ ] Verify redirect to `/login`
- [ ] Log in
- [ ] Verify access to `/dashboard`
- [ ] Verify access to `/profile`

### Public Routes
- [ ] While logged in, try accessing `/login`
- [ ] Verify redirect to `/dashboard`
- [ ] While logged in, try accessing `/signup`
- [ ] Verify redirect to `/dashboard`

## 📊 Database Trigger Verification

### Profile Creation Trigger
- [ ] Sign up a new user
- [ ] Check Supabase Dashboard → Table Editor → `profiles`
- [ ] Verify profile row exists with:
  - [ ] `id` matches `auth.users.id`
  - [ ] `email` matches signup email
  - [ ] `full_name` is populated from metadata (`full_name` field)
  - [ ] `phone` is populated from metadata
  - [ ] `username` is auto-generated
  - [ ] `created_at` timestamp is set

### Metadata Field Verification
- [ ] Check `auth.users` table → `raw_user_meta_data` column
- [ ] Verify JSON contains:
  ```json
  {
    "full_name": "Test User",
    "phone": "1234567890"
  }
  ```
- [ ] Note: Field names should be `full_name` (snake_case), not `fullName`

## 💾 Session Persistence Testing

### Browser Refresh
- [ ] Log in successfully
- [ ] Refresh the page (F5 or Cmd+R)
- [ ] Verify user remains logged in
- [ ] Verify redirect to `/dashboard` (not `/login`)
- [ ] Verify user email still displays in navigation

### Browser Tab Close/Reopen
- [ ] Log in successfully
- [ ] Close the browser tab
- [ ] Reopen the application
- [ ] Verify user remains logged in
- [ ] Verify session persisted in localStorage

### Multiple Tabs
- [ ] Log in in Tab 1
- [ ] Open new tab and navigate to app
- [ ] Verify user is logged in in Tab 2
- [ ] Log out in Tab 1
- [ ] Verify Tab 2 redirects to login (session sync)

## 👤 Profile Management Testing

### View Profile
- [ ] Navigate to `/profile`
- [ ] Verify profile information displays:
  - [ ] Email (read-only)
  - [ ] Full Name
  - [ ] Username
  - [ ] Phone
  - [ ] Status
  - [ ] Avatar (if uploaded)

### Edit Profile
- [ ] Click "Edit" button
- [ ] Modify profile fields:
  - [ ] Change Full Name
  - [ ] Change Username (must be unique)
  - [ ] Change Phone
  - [ ] Change Status
- [ ] Click "Save Changes"
- [ ] Verify success message appears
- [ ] Verify changes are saved in database
- [ ] Refresh page and verify changes persist

### Cancel Edit
- [ ] Click "Edit" button
- [ ] Modify some fields
- [ ] Click "Cancel"
- [ ] Verify changes are discarded
- [ ] Verify form resets to original values

### Avatar Upload
- [ ] Click camera icon on avatar
- [ ] Select a valid image file (JPEG, PNG, GIF, WebP)
- [ ] Verify upload progress indicator
- [ ] Verify success message
- [ ] Verify avatar updates in UI
- [ ] Verify avatar URL is saved in database
- [ ] Test with invalid file type (should show error)
- [ ] Test with file > 5MB (should show error)

## ⚠️ Error Handling Testing

### Validation Errors
- [ ] Try signup with invalid email format
- [ ] Verify error message displays
- [ ] Try signup with password < 6 characters
- [ ] Verify error message displays
- [ ] Try signup with mismatched passwords
- [ ] Verify error message displays
- [ ] Try login with wrong password
- [ ] Verify error message displays

### Network Errors
- [ ] Disconnect internet
- [ ] Try to log in
- [ ] Verify error handling (graceful failure)
- [ ] Reconnect internet
- [ ] Verify app recovers

## 🎨 UI/UX Testing

### Responsive Design
- [ ] Test on mobile (360px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify all components are responsive
- [ ] Verify navigation works on all screen sizes

### Loading States
- [ ] Verify loading spinner during signup
- [ ] Verify loading spinner during login
- [ ] Verify loading spinner during profile update
- [ ] Verify loading spinner during avatar upload
- [ ] Verify button disabled during operations

### Animations
- [ ] Verify smooth page transitions
- [ ] Verify form field animations
- [ ] Verify button hover effects
- [ ] Verify glassmorphism effects

## 🔒 Security Testing

### Route Protection
- [ ] Verify unauthenticated users cannot access protected routes
- [ ] Verify authenticated users cannot access public routes
- [ ] Verify proper redirects in all cases

### Session Management
- [ ] Verify session expires after token expiration
- [ ] Verify auto-refresh token works
- [ ] Verify logout clears all session data

## 📝 Manual Test Script

### Complete User Journey
1. **New User Signup:**
   - Navigate to `/signup`
   - Fill out complete form
   - Submit and verify profile creation
   - Verify redirect behavior

2. **User Login:**
   - Navigate to `/login`
   - Enter credentials
   - Verify successful login
   - Verify dashboard access

3. **Profile Management:**
   - Navigate to `/profile`
   - Edit profile information
   - Upload avatar
   - Verify all changes save

4. **Logout:**
   - Click logout
   - Verify session cleared
   - Verify redirect to login

5. **Session Persistence:**
   - Log in
   - Close browser
   - Reopen and verify still logged in

## ✅ Pre-Deployment Checklist

- [ ] All authentication flows tested
- [ ] Database trigger verified working
- [ ] Session persistence confirmed
- [ ] Profile management functional
- [ ] Error handling tested
- [ ] Responsive design verified
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All routes protected correctly
- [ ] Logout functionality working

## 🐛 Known Issues

_List any known issues or limitations here_

## 📊 Test Results

**Date:** _______________
**Tester:** _______________
**Environment:** Staging / Production

**Results:**
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___

---

## Quick Verification Commands

### Check Database Trigger
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check recent profile creations
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- Verify metadata field names
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

### Check Session Storage
```javascript
// In browser console
localStorage.getItem('heloo-auth')
```

