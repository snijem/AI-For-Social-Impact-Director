# Async Job-Based Video Generation Implementation

## Overview
This implementation converts the blocking video generation into a non-blocking async job system that prevents timeouts.

## Files Created/Modified

### 1. Database Schema (`lib/setup-db.js`)
- ✅ Added `generation_jobs` table to store job status, progress, and results

### 2. Storyboard Generator (`lib/storyboard-generator.js`)
- ✅ Created with fallback logic to ensure scenes count > 0
- ✅ Multiple parsing strategies (paragraphs, sentences, character chunks)
- ✅ Default 5-scene fallback if all parsing fails

### 3. Video Worker (`lib/video-worker.js`)
- ✅ Background processing function
- ✅ Creates storyboard (with fallback)
- ✅ Generates videos for each scene sequentially
- ✅ Polls Luma API with exponential backoff
- ✅ Updates job progress in database

### 4. API Endpoints

#### POST `/api/generate` (`app/api/generate/route.js`)
- ✅ Creates job immediately
- ✅ Returns `{ jobId, status: "queued" }` without waiting
- ✅ Starts background processing (fire-and-forget)

#### GET `/api/job/[jobId]` (`app/api/job/[jobId]/route.js`)
- ✅ Returns job status, progress, current step
- ✅ Returns results (storyboard, scenes array)
- ✅ Returns error details if failed

### 5. Frontend Changes (`app/studio/page.jsx`)

**REQUIRED CHANGE:** Replace the `handleGenerate` function with the following:

```javascript
const handleGenerate = async () => {
  try {
    if (script.trim().length < 60) {
      alert('Please write a longer script! At least 60 characters needed. 📝')
      return
    }

    if (!integrityConfirmed) {
      alert('Please confirm that this story reflects your own ideas before generating. ✍️')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setStatusMessage('Creating generation job...')
  } catch (error) {
    console.error('Error in handleGenerate setup:', error)
    setIsGenerating(false)
    alert('An error occurred. Please try again.')
    return
  }

  try {
    // Step 1: Create job (returns immediately with jobId) - NO TIMEOUT
    const createResponse = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ script }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create generation job')
    }

    const createData = await createResponse.json()
    const jobId = createData.jobId

    if (!jobId) {
      throw new Error('No job ID returned from server')
    }

    console.log('[Studio] Job created:', jobId)
    setStatusMessage('Job created. Starting generation...')

    // Step 2: Poll job status every 2 seconds (NO TIMEOUT on fetch)
    let pollInterval = null
    let pollAttempts = 0
    const maxPollAttempts = 600 // 20 minutes max (600 * 2s = 1200s)

    const pollJobStatus = async () => {
      try {
        pollAttempts++
        
        if (pollAttempts > maxPollAttempts) {
          clearInterval(pollInterval)
          throw new Error('Generation timeout - took too long. Please check job status later.')
        }

        const statusResponse = await fetch(`/api/job/${jobId}`)
        
        if (!statusResponse.ok) {
          if (statusResponse.status === 404) {
            throw new Error('Job not found')
          }
          const errorData = await statusResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to get job status')
        }

        const jobData = await statusResponse.json()
        
        // Update progress
        setProgress(jobData.progress || 0)
        setStatusMessage(jobData.currentStep || `Status: ${jobData.status}`)

        // Check if job is complete
        if (jobData.status === 'completed') {
          clearInterval(pollInterval)
          
          // Build result data in expected format
          const resultData = {
            id: jobId,
            status: 'completed',
            script: script,
            storyboard: jobData.results?.storyboard || null,
            scenes: (jobData.results?.scenes || []).map(scene => ({
              sceneNumber: scene.sceneNumber || scene.sceneIndex,
              imageUrl: null,
              videoUrl: scene.videoUrl,
              description: scene.description,
              generationId: scene.generationId,
            })),
            model: 'luma-dream-machine',
            created_at: jobData.createdAt || new Date().toISOString(),
            video_url: jobData.results?.scenes?.[0]?.videoUrl || null,
            generation_id: jobData.results?.scenes?.[0]?.generationId || null,
          }

          console.log('[Studio] Job completed:', resultData)

          // Save to database if user is logged in
          if (user) {
            try {
              await fetch('/api/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  script: script,
                  videoUrl: resultData.video_url,
                  generationId: resultData.generation_id,
                  status: 'completed',
                  storyboard: resultData.storyboard,
                  videoData: resultData,
                }),
              })
            } catch (dbError) {
              console.error('Error saving to database:', dbError)
            }
          }

          // Store in sessionStorage for result page
          sessionStorage.setItem('userScript', script)
          sessionStorage.setItem('videoData', JSON.stringify(resultData))
          sessionStorage.removeItem('errorMessage')

          setProgress(100)
          setStatusMessage('Generation complete!')
          
          setTimeout(() => {
            setIsGenerating(false)
            router.push('/result')
          }, 500)

        } else if (jobData.status === 'failed') {
          clearInterval(pollInterval)
          
          const errorMsg = jobData.error || 'Generation failed'
          console.error('[Studio] Job failed:', errorMsg)

          // Still save script to database
          if (user) {
            try {
              await fetch('/api/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  script: script,
                  videoUrl: null,
                  generationId: null,
                  status: 'failed',
                  storyboard: jobData.results?.storyboard || null,
                  videoData: { status: 'error', error: errorMsg },
                }),
              })
            } catch (dbError) {
              console.error('Error saving to database:', dbError)
            }
          }

          sessionStorage.setItem('userScript', script)
          sessionStorage.setItem('errorMessage', errorMsg)
          sessionStorage.setItem('videoData', JSON.stringify({
            status: 'error',
            script: script,
            error: errorMsg,
            storyboard: jobData.results?.storyboard || null,
          }))

          setIsGenerating(false)
          alert(`Generation failed: ${errorMsg}`)
          router.push('/result')
        }
        // Continue polling if status is 'queued' or 'processing'

      } catch (pollError) {
        console.error('[Studio] Poll error:', pollError)
        clearInterval(pollInterval)
        setIsGenerating(false)
        alert(`Error checking job status: ${pollError.message}`)
      }
    }

    // Start polling immediately, then every 2 seconds
    await pollJobStatus() // First poll
    pollInterval = setInterval(pollJobStatus, 2000) // Then every 2 seconds

  } catch (error) {
    console.error('[Studio] Error generating video:', error)
    setIsGenerating(false)
    
    // Save error state
    if (user) {
      try {
        await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: script,
            videoUrl: null,
            generationId: null,
            status: 'failed',
            storyboard: null,
            videoData: { status: 'error', error: error.message },
          }),
        })
      } catch (dbError) {
        console.error('Error saving to database:', dbError)
      }
    }

    sessionStorage.setItem('userScript', script)
    sessionStorage.setItem('errorMessage', error.message || 'Failed to start generation')
    sessionStorage.setItem('videoData', JSON.stringify({
      status: 'error',
      script: script,
      error: error.message,
    }))

    alert(`Failed to start generation: ${error.message}`)
    router.push('/result')
  }
}
```

## Key Features

1. **No Timeouts**: 
   - Initial request returns immediately
   - Polling uses short 2-second intervals (no long waits)
   - No AbortController timeout on fetch calls

2. **Guaranteed Scenes**:
   - Storyboard generator has multiple fallback strategies
   - Always returns at least 5 scenes if parsing fails
   - Scenes count is stored in database and checked

3. **Real-time Progress**:
   - Progress updates every 2 seconds
   - Shows current step (e.g., "Generating scene 3/7...")
   - Progress percentage from 0-100%

4. **Error Handling**:
   - Failed scenes don't stop the entire job
   - Errors are logged to server console
   - Clean error messages shown to user

## Testing

1. Restart your dev server to load new database schema
2. Click "Generate (9s)" button
3. Should see "Creating generation job..." immediately
4. Then see progress updates: "Generating scene 1/5...", etc.
5. No timeout errors should occur

## Database Migration

The `generation_jobs` table will be created automatically on first API call via `setupDatabase()`.

## Notes

- Old `/api/generate-video` endpoint still exists but is not used by new flow
- Jobs are processed in background (fire-and-forget)
- Each scene generation can take 30-60 seconds
- Full job (5-7 scenes) can take 5-10 minutes
- Progress is stored in database, so you can refresh page and check status
