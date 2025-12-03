# Deployment Guide for He'loo Platform

This guide covers deployment configuration for various platforms to ensure SPA routing works correctly and real-time features function properly.

## 🔴 CRITICAL: Environment Variables Setup

**Before deploying, you MUST configure environment variables for production!**

### Required Environment Variables

The following environment variables **MUST** be set in your deployment platform:

1. **`VITE_API_URL`** (REQUIRED) - Your backend server URL
   - Example: `https://your-api.render.com` or `https://api.yourdomain.com`
   - **This is critical for Socket.io connections!**
   - Without this, typing indicators and real-time features will NOT work

2. **`VITE_SUPABASE_URL`** (REQUIRED) - Your Supabase project URL
   - Example: `https://ckuxuusctkmuwmeqnwxw.supabase.co`

3. **`VITE_SUPABASE_ANON_KEY`** (REQUIRED) - Your Supabase anonymous key
   - This is your public Supabase API key

### Setting Environment Variables by Platform

#### Vercel

1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `VITE_API_URL` = `https://your-backend-url.com`
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
4. Select **Production**, **Preview**, and **Development** environments
5. Click **Save**
6. **Redeploy** your application for changes to take effect

#### Netlify

1. Go to your site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add a variable**
4. Add each variable:
   - `VITE_API_URL` = `https://your-backend-url.com`
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
5. Click **Save**
6. **Trigger a new deploy** for changes to take effect

#### Cloudflare Pages

1. Go to your Pages project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `VITE_API_URL` = `https://your-backend-url.com`
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
4. Select **Production** and **Preview** environments
5. Click **Save**
6. **Redeploy** your application

#### Other Platforms

Set environment variables in your platform's configuration:
- **Render**: Environment tab in service settings
- **Railway**: Variables tab in project settings
- **Heroku**: Config Vars in app settings
- **Custom Server**: Set in your `.env` file or process manager configuration

### ⚠️ Important Notes

- **Environment variables prefixed with `VITE_`** are embedded into the build at build time
- **Changes require a rebuild** - Simply updating variables won't affect already-built applications
- **Never commit `.env` files** with real values to version control
- **Test your backend URL** - Ensure your backend server is accessible at the URL you provide

### 🔍 Verifying Environment Variables

After deployment, check the browser console:
- ✅ **Success**: You should see socket connection logs: `[INFO] [socket:connect] Socket connected successfully`
- ❌ **Failure**: If you see errors about `localhost:5000` or socket connection failures, your `VITE_API_URL` is not set correctly

## 🚀 Platform-Specific Configuration

## 🚀 Platform-Specific Configuration

### Cloudflare Pages

The `_redirects` file in the `public` directory will be automatically copied to `dist` during build. This file ensures all routes redirect to `index.html` for client-side routing.

**Configuration:**
- Build command: `cd client && npm run build`
- Build output directory: `client/dist`
- Root directory: `client`

The `_redirects` file is already configured and will be included in the build.

### Vercel

The `vercel.json` file in the `public` directory provides automatic routing configuration.

**Configuration:**
- Build command: `cd client && npm run build`
- Output directory: `client/dist`
- Framework preset: Vite

### Netlify

The `netlify.toml` file in the `public` directory provides routing configuration.

**Configuration:**
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`

## 📁 File Structure

```
client/
├── public/
│   ├── _redirects          # Cloudflare Pages / Netlify
│   ├── vercel.json         # Vercel
│   ├── netlify.toml        # Netlify
│   ├── favicon.svg         # App favicon
│   └── favicon.ico         # Fallback favicon
├── dist/                   # Build output (generated)
│   ├── index.html
│   ├── assets/
│   └── _redirects          # Copied from public/
└── vite.config.ts          # Vite configuration
```

## ✅ Verification

After deployment, verify:

1. **Environment Variables**: Check browser console for configuration warnings
2. **Socket Connection**: Look for `[INFO] [socket:connect] Socket connected successfully` in console
3. **Real-time Features**: Test typing indicators and online/offline status
4. **SPA Routing**: Navigate to `/login`, `/dashboard`, or any route and refresh the page - it should load correctly
5. **Favicon**: Check browser tab - should show He'loo favicon (no 404 errors)
6. **404 Errors**: Should not see 404 errors when refreshing on any route

## 🔧 Troubleshooting

### Socket.io Connection Issues (CRITICAL)

**Symptoms:**
- Typing indicators not working
- Online/offline status not updating
- No socket connection logs in console
- Console shows connection attempts to `localhost:5000`

**Solution:**
1. Verify `VITE_API_URL` is set in your deployment platform
2. Ensure the backend URL is correct and accessible
3. Check that your backend server is running and accepting connections
4. Verify CORS is configured on your backend to allow your frontend domain
5. Rebuild and redeploy after setting environment variables

**Testing Backend URL:**
```bash
# Test if your backend is accessible
curl https://your-backend-url.com/health

# Should return: {"status":"success","message":"He'loo Server Running",...}
```

### 404 Errors on Refresh

If you still see 404 errors:

1. **Cloudflare Pages**: Ensure `_redirects` file is in `dist` directory after build
2. **Vercel**: Check that `vercel.json` is in the root of `dist` directory
3. **Netlify**: Verify `netlify.toml` is in the root of `dist` directory

### Favicon 404

The favicon files are included in the `public` directory and will be automatically copied to `dist` during build. If you still see 404:

1. Clear browser cache
2. Verify `favicon.svg` and `favicon.ico` exist in `dist` after build
3. Check that `publicDir: 'public'` is set in `vite.config.ts`

## 📝 Notes

- All redirect files use HTTP 200 status (not 301/302) to preserve the URL
- The `_redirects` file format: `/*    /index.html   200`
- Vite automatically copies the `public` directory to `dist` during build

