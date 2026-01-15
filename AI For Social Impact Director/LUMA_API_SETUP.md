# Luma API Setup Guide

## Environment Configuration

### Step 1: Create/Update `.env.local`

Ensure `.env.local` exists at the project root (same level as `package.json`):

```env
LUMA_API_KEY="luma-3a2fe67a-7b5f-4163-9e97-ef78307ec525-71e4b4ea-156a-4af2-9f4f-f3b6e54c29a8"
```

### Step 2: Restart Development Server

**IMPORTANT:** After adding or modifying `.env.local`, you MUST restart the Next.js dev server:

1. Stop the current server (Ctrl+C)
2. Run `npm run dev` again

Environment variables are only loaded when the server starts.

### Step 3: Verify Configuration

Test the API key is loaded correctly:

```bash
# Make a test request to verify
curl -X POST http://localhost:3000/api/luma/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

Or visit the app and check the browser console/server logs.

## Security Notes

- ✅ `.env.local` is already in `.gitignore` - your key won't be committed
- ✅ API key is only accessed server-side (in API routes)
- ✅ Never expose `LUMA_API_KEY` to the client (no `NEXT_PUBLIC_` prefix)
- ✅ The key is never returned in API responses

## Troubleshooting

### "Luma API key not configured" Error

1. **Check file location**: `.env.local` must be at project root
2. **Check variable name**: Must be exactly `LUMA_API_KEY` (case-sensitive)
3. **Restart server**: Stop and restart `npm run dev`
4. **Check for typos**: No extra spaces around `=`
5. **Check quotes**: Use double quotes around the key value

### Verify Key is Loaded

Check server console logs when making a request. You should see:
```
Environment check:
- LUMA_API_KEY exists: true
- LUMA_API_KEY length: [number]
```

## API Routes

- `/api/generate-video` - Main video generation endpoint
- `/api/luma/generate` - Test endpoint to verify key configuration

