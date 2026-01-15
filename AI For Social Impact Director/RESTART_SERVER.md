# How to Restart the Express Server

## Steps to Fix "Route Not Found" Error

1. **Stop the current server:**
   - Find the terminal window where the server is running
   - Press `Ctrl + C` to stop it
   - Wait until you see the prompt again

2. **Restart the server:**
   ```bash
   npm run server
   ```

3. **Verify it's running:**
   - You should see: `🚀 Express server running on http://localhost:${PORT}`
   - You should see: `📊 Root: http://localhost:${PORT}/`
   - You should see: `✅ All routes registered successfully`

4. **Test the root route:**
   - Open browser: `http://localhost:3001/`
   - You should see JSON with API information
   - Check the server console - you should see: `Root route hit!`

## If Still Not Working

1. **Check which port the server is using:**
   - Look at the console output when starting
   - Make sure you're accessing the correct port (usually 3001)

2. **Clear browser cache:**
   - Press `Ctrl + Shift + R` (hard refresh)
   - Or open in incognito/private window

3. **Check server console:**
   - When you visit `http://localhost:3001/`, you should see:
   ```
   YYYY-MM-DDTHH:mm:ss.sssZ - GET /
   Root route hit!
   ```

4. **Verify the file:**
   - Make sure `server.js` exists in: `AI For Social Impact Director/server.js`
   - The file should have the root route at line 22

## Quick Test Commands

```bash
# Test root route
curl http://localhost:3001/

# Test health endpoint
curl http://localhost:3001/health

# Test database connection
curl http://localhost:3001/test-db
```
