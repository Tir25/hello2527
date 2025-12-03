# Deployment Guide for He'loo Platform

This guide covers deployment configuration for various platforms to ensure SPA routing works correctly.

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

1. **SPA Routing**: Navigate to `/login`, `/dashboard`, or any route and refresh the page - it should load correctly
2. **Favicon**: Check browser tab - should show He'loo favicon (no 404 errors)
3. **404 Errors**: Should not see 404 errors when refreshing on any route

## 🔧 Troubleshooting

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

