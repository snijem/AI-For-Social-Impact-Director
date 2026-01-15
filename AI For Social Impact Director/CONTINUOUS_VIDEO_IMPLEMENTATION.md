# Continuous 1-Minute Video Generator Implementation

## Overview
This implementation creates a continuous 1-minute video generator that maintains story/character consistency across all clips and merges them into ONE final video.

## Key Features

### 1. Story & Character Locking
- **Story Context Extractor** (`lib/story-context-extractor.js`):
  - Extracts characters (names, descriptions, appearance)
  - Extracts setting/environment
  - Extracts visual style
  - Extracts theme/topic
  
- **Context Injection**: Every prompt includes:
  - Character descriptions
  - Setting information
  - Visual style requirements
  - Continuation instructions (for clips 2-7)

### 2. Scene Continuity
- **Clip 1**: Normal text-to-video generation with full story context
- **Clips 2-7**: Use Luma's continuation mechanism:
  ```javascript
  keyframes: {
    frame1: {
      type: 'generation',
      id: previousGenerationId
    }
  }
  ```
- **Prompt Enhancement**: "Continue the previous scene seamlessly. Same characters: [CHARACTERS]. Same environment: [SETTING]. No new characters. No style changes."

### 3. Video Merging
- **FFmpeg Integration** (`lib/video-merger.js`):
  - Downloads all clip videos
  - Creates concat file list
  - Merges using `ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4`
  - Saves to `/public/merged-videos/`
  - Returns single merged video URL

### 4. User Experience
- **Progress**: "Generating scene 3 of 7..."
- **Result**: ONE merged video (individual clips hidden)
- **UI**: Single video player, single download button

## Files Created/Modified

### New Files
1. **`lib/story-context-extractor.js`**
   - Extracts story context from script
   - Builds contextual prompts with story locking

2. **`lib/video-merger.js`**
   - Downloads videos from URLs
   - Merges using ffmpeg
   - Handles errors gracefully

### Modified Files
1. **`lib/video-worker.js`**
   - Extracts story context before generation
   - Uses contextual prompts with story locking
   - Uses keyframes for continuation (clips 2-7)
   - Merges videos after all clips generated
   - Stores merged video URL

2. **`app/api/job/[jobId]/route.js`**
   - Returns only merged video URL
   - Hides individual clip URLs from user

3. **`app/studio/page.jsx`**
   - Shows single merged video result
   - Hides individual scenes

## Constraints Enforced

✅ **Budget**: $2 max (7 clips × $0.25 = $1.75)  
✅ **Model**: `ray-flash-2` (cheapest)  
✅ **Resolution**: `540p` (no upscale)  
✅ **Audio**: OFF (not requested in API)  
✅ **Max Clips**: 7 (enforced)  
✅ **Clip Duration**: 9 seconds each  
✅ **Total Length**: ~63 seconds (7 × 9s)

## Story Context Example

**Input Script:**
```
Once upon a time, in a small coastal village, the ocean was filled with plastic waste. Maria, a young student, noticed that sea turtles were getting sick. She decided to organize a beach cleanup with her friends.
```

**Extracted Context:**
```javascript
{
  characters: [
    { name: 'Maria', description: 'A young student', appearance: 'Consistent appearance' }
  ],
  setting: 'ocean',
  visualStyle: '2D animation with bright colors, clean animation style, educational and inspiring',
  theme: 'ocean'
}
```

**Generated Prompt (Clip 1):**
```
A 2D animation about ocean. Characters: Maria (A young student). Environment: ocean. Visual style: 2D animation with bright colors, clean animation style, educational and inspiring. Once upon a time, in a small coastal village, the ocean was filled with plastic waste. Maria, a young student, noticed that sea turtles were getting sick. Bright colors, clean animation style, educational and inspiring.
```

**Generated Prompt (Clip 2-7):**
```
A 2D animation about ocean. Continue the previous scene seamlessly. Same characters: Maria (A young student). Same environment: ocean. Same visual style: 2D animation with bright colors, clean animation style, educational and inspiring. No new characters. No style changes. [Scene description]. Bright colors, clean animation style, educational and inspiring.
```

## FFmpeg Requirements

**Installation:**
- Windows: Download from https://ffmpeg.org/download.html
- macOS: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg`

**Note**: If ffmpeg is not available, the system will fall back to using the first video clip.

## Testing

1. **Start dev server**: `npm run dev`
2. **Write a script** with character names and setting
3. **Click "Generate (9s)"** button
4. **Watch progress**: "Generating scene 1/7...", "Generating scene 2/7 (continuing story)..."
5. **Wait for completion**: "Merging clips into final video..."
6. **Result**: ONE merged video file displayed

## Error Handling

- **Story context extraction fails**: Uses default context
- **Individual clip fails**: Continues with remaining clips
- **FFmpeg not available**: Falls back to first video
- **Merge fails**: Falls back to first video
- **Budget exceeded**: Stops generation with error message

## Database Schema

The `generation_jobs` table stores:
- `scenes`: JSON with `mergedVideoUrl`, `individualClips` (hidden from user)
- `storyboard`: Includes `storyContext` for reference

## API Response Format

**Job Status Response:**
```json
{
  "status": "completed",
  "results": {
    "video_url": "/merged-videos/merged_job123_1234567890.mp4",
    "merged_video_url": "/merged-videos/merged_job123_1234567890.mp4",
    "scenes": [
      {
        "sceneIndex": 1,
        "description": "...",
        "videoUrl": null,  // Hidden from user
        "generationId": "..."
      }
    ],
    "scenes_count": 7
  }
}
```

## Notes

- Individual clip URLs are stored but NOT exposed to users
- Only the merged video URL is returned
- Story context is locked at the start and reused for all clips
- Continuation mechanism ensures smooth transitions between clips
- FFmpeg merging creates a seamless final video
