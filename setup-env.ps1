# He'loo Platform - Environment Setup Script
# This script creates the required .env files for client and server

Write-Host "🚀 Setting up environment files for He'loo Platform..." -ForegroundColor Cyan
Write-Host ""

# Create client .env file
$clientEnvPath = Join-Path $PSScriptRoot "client\.env"
$clientEnvContent = @"
VITE_SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODE4ODksImV4cCI6MjA4MDA1Nzg4OX0.gmWqJY0VvIVEmQzisbxdLgeAURZhCr5g_xrGZtOXKXk
VITE_API_URL=http://localhost:5000
"@

if (Test-Path $clientEnvPath) {
    Write-Host "⚠️  Client .env file already exists. Skipping..." -ForegroundColor Yellow
} else {
    $clientEnvContent | Out-File -FilePath $clientEnvPath -Encoding utf8 -NoNewline
    Write-Host "✅ Created client/.env" -ForegroundColor Green
}

# Create server .env file
$serverEnvPath = Join-Path $PSScriptRoot "server\.env"
$serverEnvContent = @"
PORT=5000
SUPABASE_URL=https://ckuxuusctkmuwmeqnwxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXh1dXNjdGttdXdtZXFud3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ4MTg4OSwiZXhwIjoyMDgwMDU3ODg5fQ.i11iqD8FggmMi0U5MfjHcLSQhk9_hk7o3B3l67-aaWc
CLIENT_URL=http://localhost:3000
NODE_ENV=development
"@

if (Test-Path $serverEnvPath) {
    Write-Host "⚠️  Server .env file already exists. Skipping..." -ForegroundColor Yellow
} else {
    $serverEnvContent | Out-File -FilePath $serverEnvPath -Encoding utf8 -NoNewline
    Write-Host "✅ Created server/.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify the .env files contain the correct values" -ForegroundColor White
Write-Host "  2. Run 'npm run dev' in both client/ and server/ directories" -ForegroundColor White
Write-Host ""

