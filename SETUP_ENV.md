# Environment Setup Guide

This guide will help you create the required `.env` files for both the client and server.

## Quick Setup

### Option 1: Manual Creation

#### Client Environment (`.env` file in `heloo-platform/client/`)

Create a file named `.env` in the `client` directory with the following content:

```env
VITE_SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODE4ODksImV4cCI6MjA4MDA1Nzg4OX0.gmWqJY0VvIVEmQzisbxdLgeAURZhCr5g_xrGZtOXKXk
VITE_API_URL=http://localhost:5000
```

#### Server Environment (`.env` file in `heloo-platform/server/`)

Create a file named `.env` in the `server` directory with the following content:

```env
PORT=5000
SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ4MTg4OSwiZXhwIjoyMDgwMDU3ODg5fQ.i11iqD8FggmMi0U5MfjHcLSQhk9_hk7o3B3l67-aaWc
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Option 2: PowerShell Script

Run the following PowerShell commands from the `heloo-platform` directory:

```powershell
# Create client .env file
@"
VITE_SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODE4ODksImV4cCI6MjA4MDA1Nzg4OX0.gmWqJY0VvIVEmQzisbxdLgeAURZhCr5g_xrGZtOXKXk
VITE_API_URL=http://localhost:5000
"@ | Out-File -FilePath "client\.env" -Encoding utf8

# Create server .env file
@"
PORT=5000
SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ4MTg4OSwiZXhwIjoyMDgwMDU3ODg5fQ.i11iqD8FggmMi0U5MfjHcLSQhk9_hk7o3B3l67-aaWc
CLIENT_URL=http://localhost:3000
NODE_ENV=development
"@ | Out-File -FilePath "server\.env" -Encoding utf8

Write-Host "✅ Environment files created successfully!" -ForegroundColor Green
```

### Option 3: Bash Script (if using Git Bash or WSL)

Run the following commands from the `heloo-platform` directory:

```bash
# Create client .env file
cat > client/.env << 'EOF'
VITE_SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODE4ODksImV4cCI6MjA4MDA1Nzg4OX0.gmWqJY0VvIVEmQzisbxdLgeAURZhCr5g_xrGZtOXKXk
VITE_API_URL=http://localhost:5000
EOF

# Create server .env file
cat > server/.env << 'EOF'
PORT=5000
SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ4MTg4OSwiZXhwIjoyMDgwMDU3ODg5fQ.i11iqD8FggmMi0U5MfjHcLSQhk9_hk7o3B3l67-aaWc
CLIENT_URL=http://localhost:3000
NODE_ENV=development
EOF

echo "✅ Environment files created successfully!"
```

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

