# 🔴 Production Environment Setup - CRITICAL

## Overview

This document provides step-by-step instructions for configuring environment variables in production to ensure Socket.io and all real-time features work correctly.

## 🎯 Quick Start

**The Problem:** Without `VITE_API_URL` set in production, Socket.io defaults to `http://localhost:5000`, which doesn't exist in production. This breaks:
- ❌ Typing indicators
- ❌ Online/offline presence
- ❌ Real-time user status updates
- ❌ All Socket.io-based features

**The Solution:** Set environment variables in your deployment platform before building.

---

## 📋 Required Environment Variables

### 1. VITE_API_URL (REQUIRED)

**What it is:** Your deployed backend server URL where Socket.io is running.

**How to find it:**
- If using Render: `https://your-service-name.onrender.com`
- If using Railway: `https://your-service.up.railway.app`
- If using Heroku: `https://your-app.herokuapp.com`
- If using custom server: `https://your-domain.com` or `https://api.yourdomain.com`

**Example values:**
```
VITE_API_URL=https://heloo-api.onrender.com
VITE_API_URL=https://api.heloo.com
VITE_API_URL=https://heloo-backend.up.railway.app
```

**⚠️ Important:**
- Must start with `http://` or `https://`
- Must NOT include trailing slash (`/`)
- Must be accessible from the internet (not localhost)
- Backend server must be running and accepting connections

### 2. VITE_SUPABASE_URL (REQUIRED)

**What it is:** Your Supabase project URL.

**Example:**
```
VITE_SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
```

### 3. VITE_SUPABASE_ANON_KEY (REQUIRED)

**What it is:** Your Supabase anonymous/public API key.

**Where to find it:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **anon/public** key

**Example:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Platform-Specific Instructions

### Vercel

1. **Navigate to Project Settings**
   - Go to [vercel.com](https://vercel.com)
   - Select your project
   - Click **Settings** → **Environment Variables**

2. **Add Variables**
   - Click **Add New**
   - Add each variable:
     ```
     Name: VITE_API_URL
     Value: https://your-backend-url.com
     Environment: Production, Preview, Development
     ```
   - Repeat for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

3. **Save and Redeploy**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **⋯** → **Redeploy** on latest deployment

### Netlify

1. **Navigate to Site Settings**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Select your site
   - Click **Site Settings** → **Environment Variables**

2. **Add Variables**
   - Click **Add a variable**
   - Add each variable:
     ```
     Key: VITE_API_URL
     Value: https://your-backend-url.com
     Scopes: All scopes (or specific scopes)
     ```
   - Repeat for other variables

3. **Trigger Redeploy**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

### Cloudflare Pages

1. **Navigate to Project Settings**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Select **Pages** → Your project
   - Click **Settings** → **Environment Variables**

2. **Add Variables**
   - Click **Add variable**
   - Add each variable:
     ```
     Variable name: VITE_API_URL
     Value: https://your-backend-url.com
     Environment: Production, Preview
     ```
   - Repeat for other variables

3. **Redeploy**
   - Go to **Deployments** tab
   - Click **Retry deployment** on latest deployment

### Render

1. **Navigate to Service Settings**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Select your frontend service
   - Click **Environment** tab

2. **Add Variables**
   - Click **Add Environment Variable**
   - Add each variable:
     ```
     Key: VITE_API_URL
     Value: https://your-backend-url.com
     ```
   - Repeat for other variables

3. **Save**
   - Changes are applied automatically
   - Service will rebuild automatically

### Railway

1. **Navigate to Project Settings**
   - Go to [railway.app](https://railway.app)
   - Select your project → Frontend service
   - Click **Variables** tab

2. **Add Variables**
   - Click **+ New Variable**
   - Add each variable:
     ```
     Name: VITE_API_URL
     Value: https://your-backend-url.com
     ```
   - Repeat for other variables

3. **Redeploy**
   - Railway automatically redeploys on variable changes

---

## ✅ Verification Steps

### 1. Check Environment Variables Are Set

After setting variables and redeploying:

1. Open your deployed application
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Look for configuration logs:
   - ✅ **Good**: No errors about missing `VITE_API_URL`
   - ❌ **Bad**: Errors about `localhost:5000` or missing variables

### 2. Test Socket Connection

1. Log into your application
2. Open browser DevTools → **Console**
3. Look for these logs:
   ```
   [INFO] [socket:connect] Creating new socket connection to https://your-backend-url.com
   [INFO] [socket:connect] Socket connected successfully <socket-id>
   [INFO] [socket:initial_online_users] Received initial online users
   ```

4. **If you see these logs:** ✅ Socket is working!
5. **If you DON'T see these logs:** ❌ Check `VITE_API_URL` is set correctly

### 3. Test Real-time Features

1. **Typing Indicators:**
   - Open chat with another user
   - Start typing
   - Other user should see typing indicator

2. **Online/Offline Status:**
   - Check sidebar for user online indicators
   - Users should show as online/offline correctly

3. **Presence:**
   - Multiple users should see each other's online status

---

## 🔍 Troubleshooting

### Problem: Socket still connecting to localhost:5000

**Causes:**
1. Environment variable not set in deployment platform
2. Variable name is incorrect (must be `VITE_API_URL`, not `API_URL`)
3. Application not rebuilt after setting variables
4. Wrong environment selected (e.g., set in Development but deploying Production)

**Solutions:**
1. Double-check variable name is exactly `VITE_API_URL`
2. Ensure variable is set for **Production** environment
3. **Redeploy** after setting variables (variables are embedded at build time)
4. Check deployment logs to verify variables are being used

### Problem: Backend URL not accessible

**Test your backend:**
```bash
# Test if backend is running
curl https://your-backend-url.com/health

# Should return:
# {"status":"success","message":"He'loo Server Running","timestamp":"..."}
```

**If curl fails:**
- Backend server is not running
- Backend URL is incorrect
- Backend has CORS issues
- Backend firewall blocking connections

### Problem: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Socket connection fails with CORS-related errors

**Solution:**
Update your backend server's CORS configuration to allow your frontend domain:

```typescript
// In your backend server (server/src/index.ts)
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'https://your-frontend-domain.com',
        methods: ['GET', 'POST'],
    },
})
```

---

## 📝 Example Configuration

### Complete Example for Vercel

```
Environment Variables:
├── VITE_API_URL
│   └── https://heloo-api.onrender.com
├── VITE_SUPABASE_URL
│   └── https://ckuxuusctkmuwmeqnwxw.supabase.co
└── VITE_SUPABASE_ANON_KEY
    └── eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Complete Example for Netlify

```toml
# In netlify.toml (or via dashboard)
[build.environment]
  VITE_API_URL = "https://heloo-api.onrender.com"
  VITE_SUPABASE_URL = "https://ckuxuusctkmuwmeqnwxw.supabase.co"
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🎯 Quick Checklist

Before deploying to production, ensure:

- [ ] Backend server is deployed and accessible
- [ ] Backend URL is tested with `curl` or browser
- [ ] `VITE_API_URL` is set in deployment platform
- [ ] `VITE_SUPABASE_URL` is set in deployment platform
- [ ] `VITE_SUPABASE_ANON_KEY` is set in deployment platform
- [ ] Variables are set for **Production** environment
- [ ] Application is **rebuilt/redeployed** after setting variables
- [ ] Socket connection logs appear in browser console
- [ ] Typing indicators work in production
- [ ] Online/offline status updates correctly

---

## 📞 Need Help?

If you're still experiencing issues:

1. Check browser console for specific error messages
2. Verify backend server is running: `curl https://your-backend-url.com/health`
3. Check deployment platform logs for build errors
4. Ensure all environment variables are set correctly
5. Verify you've redeployed after setting variables

---

## 🔗 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide
- [SETUP_ENV.md](./SETUP_ENV.md) - Development environment setup
- [README.md](./README.md) - Project overview

