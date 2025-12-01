# Environment Setup Guide

This guide will help you create the required `.env` files for both the client and server.

## Quick Setup (Local Development)

### Option 1: Manual Creation

#### Client Environment (`.env` file in `heloo-platform/client/`)

Create a file named `.env` in the `client` directory with the following **example** content:

```env
VITE_SUPABASE_URL=<your_supabase_project_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_public_key>
VITE_API_URL=http://localhost:5000
```

#### Server Environment (`.env` file in `heloo-platform/server/`)

Create a file named `.env` in the `server` directory with the following **example** content:

```env
PORT=5000
SUPABASE_URL=<your_supabase_project_url>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Option 2: Scripted Creation (Optional)

You can also script creation of these files if you prefer, but **never hard-code real secrets in version-controlled scripts**.  
Instead, use your shell or CI/CD secrets to echo the correct values into `.env` files on your own machine or in your deployment pipeline.

## Verification

After creating the `.env` files, verify they exist:

```powershell
Test-Path client\.env
Test-Path server\.env
```

Both should return `True`.

## Important Notes

- **Never commit `.env` files to version control** - They are already in `.gitignore`
- **The `.env.example` files** are provided as templates for other developers
- **Update environment variables** if you change Supabase projects or deployment URLs

## Environment Variables Explained

### Client (`client/.env`)

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Public anonymous key for client-side Supabase operations
- `VITE_API_URL`: Backend API URL (defaults to localhost:5000 for development)

### Server (`server/.env`)

- `PORT`: Server port (default: 5000)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations (⚠️ **NEVER expose this to client**)
- `CLIENT_URL`: Frontend URL for CORS configuration
- `NODE_ENV`: Environment mode (development/production)

