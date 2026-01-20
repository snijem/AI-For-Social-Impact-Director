# Luma to Runway Migration Summary

## Changes Made

### ✅ Completed

1. **Created Provider Abstraction Layer**
   - `lib/video/provider.ts` - Interface definition
   - `lib/video/runway.ts` - Runway ML implementation
   - `lib/video/index.ts` - Provider export
   - `lib/video/runway-long.ts` - Long video generator (60s via multiple clips)

2. **Updated Video Worker**
   - `lib/video-worker.js` - Now uses Runway provider instead of Luma
   - Fixed progress calculation to prevent 90% glitching
   - Removed Luma-specific code
   - Added progress tracking to prevent backwards progress

3. **Progress Fix**
   - Added `lastProgressUpdate` tracking to prevent progress from going backwards
   - Progress now only increases, fixing the 90% glitch issue

### ⚠️ Current Limitations

1. **Duration Limitation**: Runway API supports max 10 seconds per clip
   - Current implementation generates 1 clip of 10s
   - For 60s videos, would need to generate 6 clips and merge them
   - TODO: Implement Runway extend API when available, or add server-side merging

2. **Environment Variable**: 
   - Uses `RUNAWAY_API_KEY` from `.env.local`
   - Also checks `RUNWAYML_API_SECRET` (SDK default)

### 📝 Files Changed

**New Files:**
- `lib/video/provider.ts`
- `lib/video/runway.ts`
- `lib/video/index.ts`
- `lib/video/runway-long.ts`

**Modified Files:**
- `lib/video-worker.js` - Migrated to Runway, fixed progress glitch

**Files to Update (Not Yet Done):**
- `app/api/generate/route.js` - May need duration parameter support
- Remove FFmpeg merging from main flow (kept for legacy support)

### 🔧 Configuration Required

1. **Environment Variable**: Add to `.env.local`:
   ```
   RUNAWAY_API_KEY=your_runway_api_key_here
   ```

2. **Runway SDK**: Already installed (`@runwayml/sdk@^3.11.0`)

### 🚀 Next Steps

1. Test with Runway API key
2. If 60s videos needed: Implement clip merging or wait for Runway extend API
3. Remove legacy Luma code from other routes
4. Update frontend to handle Runway video URLs

### 🐛 Known Issues

1. Currently generates 10s videos (Runway max) instead of 60s
2. Progress glitch should be fixed, but needs testing
3. Long video generator exists but returns first clip only

### 📚 API Changes

**Request (unchanged):**
```json
{
  "script": "string"
}
```

**Response (unchanged):**
```json
{
  "success": true,
  "jobId": "job_...",
  "status": "queued"
}
```

Job status response unchanged - video URL format may differ (Runway URLs vs Luma URLs).
