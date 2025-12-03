# Cleanup Media Edge Function

This Edge Function provides an HTTP endpoint to trigger the `delete_old_media()` cleanup function.

## Purpose

While `pg_cron` is already set up and working, this Edge Function provides an alternative way to trigger cleanup:

1. **External Cron Services** - Use services like cron-job.org to call this function via HTTP
2. **Manual Triggering** - Call it manually via HTTP request
3. **Backup Method** - If pg_cron fails, you can use this as a fallback

## Deployment

### Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ckuxuusctkmuwmeqnwxw

# Deploy the function
supabase functions deploy cleanup-media
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `cleanup-media`
5. Copy the code from `index.ts`
6. Deploy

## Usage

### Manual HTTP Request

```bash
# Get your project URL and anon key from Supabase dashboard
curl -X POST \
  'https://ckuxuusctkmuwmeqnwxw.supabase.co/functions/v1/cleanup-media' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Using External Cron Service

1. **cron-job.org** (Free):
   - Create account at https://cron-job.org
   - Create new cron job
   - URL: `https://ckuxuusctkmuwmeqnwxw.supabase.co/functions/v1/cleanup-media`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_ANON_KEY`
   - Schedule: Every hour (`0 * * * *`)

2. **GitHub Actions** (Free for public repos):
   ```yaml
   name: Cleanup Media
   on:
     schedule:
       - cron: '0 * * * *'  # Every hour
   jobs:
     cleanup:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Cleanup
           run: |
             curl -X POST \
               'https://ckuxuusctkmuwmeqnwxw.supabase.co/functions/v1/cleanup-media' \
               -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
   ```

## Response Format

### Success Response
```json
{
  "success": true,
  "deleted_count": 5,
  "deleted_files": [
    "user-id/video1.mp4",
    "user-id/image1.jpg"
  ],
  "message": "Successfully cleaned up 5 media files"
}
```

### Error Response
```json
{
  "error": "Failed to cleanup media",
  "details": "Error message here"
}
```

## Security

⚠️ **Important:** This function uses the service role key, which has full database access. 

**Options:**
1. **Use Anon Key** - Modify the function to use anon key and add RLS policies
2. **Add Authentication** - Require a secret token in the request
3. **IP Whitelist** - Restrict to specific IPs (if using external cron)

## Current Status

✅ **pg_cron is working** - The cleanup job is already scheduled and running automatically every hour. This Edge Function is optional and only needed if:
- You want to trigger cleanup manually
- You want a backup method
- You prefer external cron services

## Testing

Test the function locally:

```bash
# Start Supabase locally
supabase start

# Test the function
curl -X POST \
  'http://localhost:54321/functions/v1/cleanup-media' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```




