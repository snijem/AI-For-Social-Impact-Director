# Luma Video Generator Troubleshooting Guide

## Step 1: Check if Server is Running

1. **Look for your terminal/command prompt** where you ran `npm run dev`
2. **You should see something like:**
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Ready in X seconds
   ```
3. **If you DON'T see this**, the server isn't running. Start it:
   ```bash
   cd "AI For Social Impact Director"
   npm run dev
   ```

## Step 2: Check Server Console Logs

1. **Look at the terminal where `npm run dev` is running**
2. **Scroll up** to see startup messages
3. **Look for this line:**
   ```
   [Luma API Route] LUMA key loaded: true
   ```
4. **If you see `false`**, your API key isn't loaded - restart the server

## Step 3: Test the API Route in Browser

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)
2. **Type in the address bar:**
   ```
   http://localhost:3000/api/generate-video
   ```
3. **Press Enter**
4. **You should see JSON like:**
   ```json
   {
     "message": "Luma Video Generation API",
     "method": "Use POST to generate videos",
     ...
   }
   ```
5. **If you see 404**, the server needs to be restarted (see Step 1)

## Step 4: Test Video Generation

1. **Go to:** `http://localhost:3000/studio`
2. **Write a script** (at least 60 characters)
3. **Check the checkbox:** "I confirm this story reflects my own ideas"
4. **Click:** "Generate Animation ✨"
5. **Watch the terminal** (where `npm run dev` is running) for `[Luma API]` logs

## Step 5: Check for Errors

### In Browser:
- **Open Developer Tools:** Press `F12` or right-click → Inspect
- **Go to Console tab**
- **Look for red error messages**
- **Copy the error message**

### In Server Terminal:
- **Look for lines starting with `[Luma API]`**
- **Copy any error messages**

## Step 6: Restart Server (If Needed)

1. **Go to the terminal** running `npm run dev`
2. **Press:** `Ctrl + C` (Windows) or `Cmd + C` (Mac)
3. **Wait for it to stop**
4. **Run again:**
   ```bash
   npm run dev
   ```
5. **Wait for:** `Ready on http://localhost:3000`

## Common Issues

### Issue: 404 Error
**Solution:** Server not running or needs restart (see Step 6)

### Issue: "LUMA key loaded: false"
**Solution:** 
1. Check `.env.local` file exists in `AI For Social Impact Director` folder
2. Make sure it contains: `LUMA_API_KEY=luma-...`
3. Restart server

### Issue: "Duration error"
**Solution:** Already fixed in code - just restart server

### Issue: Video generation fails
**Solution:** Check server console for `[Luma API]` error messages

## Quick Diagnostic URLs

Visit these in your browser to check status:

- **API Info:** `http://localhost:3000/api/generate-video`
- **Diagnostics:** `http://localhost:3000/api/diagnose`
- **Test Luma:** `http://localhost:3000/api/test-luma`
- **Health Check:** `http://localhost:3000/api/health`

## Still Having Issues?

Share:
1. **What you see** when visiting `http://localhost:3000/api/generate-video`
2. **Error messages** from browser console (F12 → Console tab)
3. **Error messages** from server terminal (where `npm run dev` runs)
