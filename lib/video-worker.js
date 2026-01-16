/**
 * Background Video Generation Worker
 * Processes generation jobs asynchronously
 */

import { queryDB } from './db'
import { generateStoryboard } from './storyboard-generator'
import { extractStoryContext, buildContextualPrompt } from './story-context-extractor'
import path from 'path'
import fs from 'fs/promises'

// Dynamically import video-merger only when needed (server-side only)
let mergeVideos, checkFFmpegAvailable
async function loadVideoMerger() {
  if (!mergeVideos) {
    const merger = await import('./video-merger')
    mergeVideos = merger.mergeVideos
    checkFFmpegAvailable = merger.checkFFmpegAvailable
  }
  return { mergeVideos, checkFFmpegAvailable }
}

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1'
const DEFAULT_MODEL = 'ray-flash-2'
const DEFAULT_RESOLUTION = '540p'
const DURATION = '9s'
const MAX_CLIPS = 7 // Maximum clips for 1-minute video
const TARGET_SECONDS = 60 // 1 minute target

/**
 * Process a generation job
 * @param {string} jobId - The job ID
 */
export async function processGenerationJob(jobId) {
  console.log(`[Video Worker] Starting job: ${jobId}`)
  
  try {
    // Get job from database
    const jobs = await queryDB(
      'SELECT * FROM generation_jobs WHERE job_id = ?',
      [jobId]
    )
    
    if (jobs.length === 0) {
      throw new Error(`Job ${jobId} not found`)
    }
    
    const job = jobs[0]
    
    // Update status to processing
    await queryDB(
      'UPDATE generation_jobs SET status = ?, current_step = ? WHERE job_id = ?',
      ['processing', 'Creating storyboard...', jobId]
    )
    
    // Step 1: Extract story context (characters, setting, style) - CRITICAL for consistency
    console.log(`[Video Worker] Extracting story context for job: ${jobId}`)
    const storyContext = extractStoryContext(job.script)
    console.log(`[Video Worker] Story context:`, JSON.stringify(storyContext, null, 2))
    
    // Step 2: Generate storyboard (with fallback)
    console.log(`[Video Worker] Generating storyboard for job: ${jobId}`)
    const storyboard = generateStoryboard(job.script)
    
    // Ensure scenes count > 0, limit to MAX_CLIPS
    if (!storyboard.scenes || storyboard.scenes.length === 0) {
      console.warn(`[Video Worker] Storyboard has 0 scenes, using fallback`)
      const fallback = generateStoryboard(job.script)
      storyboard.scenes = fallback.scenes
    }
    
    // Limit to MAX_CLIPS for 1-minute video
    storyboard.scenes = storyboard.scenes.slice(0, MAX_CLIPS)
    const scenesCount = Math.min(storyboard.scenes.length, MAX_CLIPS)
    
    // Update job with storyboard and story context
    await queryDB(
      `UPDATE generation_jobs 
       SET storyboard = ?, scenes_count = ?, progress = ?, current_step = ? 
       WHERE job_id = ?`,
      [
        JSON.stringify({ ...storyboard, storyContext }),
        scenesCount,
        10, // 10% progress
        `Storyboard created (${scenesCount} scenes). Characters: ${storyContext.characters.map(c => c.name).join(', ')}`,
        jobId
      ]
    )
    
    console.log(`[Video Worker] Storyboard created: ${scenesCount} scenes`)
    console.log(`[Video Worker] Story context locked: ${storyContext.characters.length} characters, setting: ${storyContext.setting}`)
    
    // Step 3: Generate videos for each scene with story continuity
    const lumaApiKey = process.env.LUMA_API_KEY
    if (!lumaApiKey) {
      throw new Error('Luma API key not configured')
    }
    
    const scenes = []
    let previousGenerationId = null // Track previous generation for continuation
    
    for (let i = 0; i < scenesCount; i++) {
      const scene = storyboard.scenes[i]
      const sceneIndex = i + 1
      const isContinuation = sceneIndex > 1 // Clips 2-7 are continuations
      
      // Update progress
      const progress = 10 + Math.floor((i / scenesCount) * 80) // 10% to 90%
      await queryDB(
        'UPDATE generation_jobs SET progress = ?, current_step = ? WHERE job_id = ?',
        [
          progress,
          `Generating scene ${sceneIndex}/${scenesCount}${isContinuation ? ' (continuing story)...' : '...'}`,
          jobId
        ]
      )
      
      console.log(`[Video Worker] Generating scene ${sceneIndex}/${scenesCount} for job: ${jobId}`)
      console.log(`[Video Worker] Is continuation: ${isContinuation}, Previous ID: ${previousGenerationId || 'none'}`)
      
      try {
        // Build contextual prompt with story locking
        const videoPrompt = buildContextualPrompt(
          storyContext,
          scene.description,
          sceneIndex,
          isContinuation
        )
        
        console.log(`[Video Worker] Scene ${sceneIndex} prompt:`, videoPrompt.substring(0, 200) + '...')
        
        // Create Luma generation with continuation if needed
        const generationData = await createLumaGeneration(
          videoPrompt, 
          lumaApiKey,
          previousGenerationId // Pass previous ID for continuation (clips 2-7)
        )
        const generationId = generationData.id
        
        if (!generationId) {
          throw new Error('No generation ID returned from Luma API')
        }
        
        console.log(`[Video Worker] Scene ${sceneIndex} generation created: ${generationId}`)
        
        // Update status: waiting for Luma API
        await queryDB(
          'UPDATE generation_jobs SET current_step = ? WHERE job_id = ?',
          [`Waiting for scene ${sceneIndex} to complete...`, jobId]
        )
        
        // Poll for completion with progress updates
        const pollResult = await pollLumaGeneration(
          generationId, 
          lumaApiKey,
          jobId,
          sceneIndex,
          scenesCount
        )
        
        if (!pollResult.success) {
          throw new Error(pollResult.error || 'Generation failed')
        }
        
        const videoUrl = pollResult.videoUrl
        
        // Store scene result
        scenes.push({
          sceneIndex: sceneIndex,
          sceneNumber: scene.sceneNumber,
          prompt: videoPrompt,
          videoUrl: videoUrl,
          generationId: generationId,
          description: scene.description,
          duration: scene.duration || 9
        })
        
        // Set previous generation ID for next clip's continuation
        previousGenerationId = generationId
        
        console.log(`[Video Worker] Scene ${sceneIndex} completed: ${videoUrl}`)
        console.log(`[Video Worker] Previous generation ID for next clip: ${previousGenerationId}`)
        
        // Update job with current scenes
        await queryDB(
          'UPDATE generation_jobs SET scenes = ? WHERE job_id = ?',
          [JSON.stringify(scenes), jobId]
        )
        
      } catch (sceneError) {
        console.error(`[Video Worker] Error generating scene ${sceneIndex}:`, sceneError)
        
        // Continue with other scenes even if one fails
        // Store error in scene data
        scenes.push({
          sceneIndex: sceneIndex,
          sceneNumber: scene.sceneNumber,
          prompt: scene.description,
          videoUrl: null,
          generationId: null,
          description: scene.description,
          duration: scene.duration || 9,
          error: sceneError.message
        })
        
        // Update job with partial scenes
        await queryDB(
          'UPDATE generation_jobs SET scenes = ? WHERE job_id = ?',
          [JSON.stringify(scenes), jobId]
        )
      }
    }
    
    // Step 4: Merge all clips into ONE final video
    const completedScenes = scenes.filter(s => s.videoUrl)
    const videoUrls = completedScenes.map(s => s.videoUrl)
    
    if (videoUrls.length === 0) {
      throw new Error('No videos generated to merge')
    }
    
    console.log(`[Video Worker] Merging ${videoUrls.length} clips into one video...`)
    
    // Update status: merging
    await queryDB(
      'UPDATE generation_jobs SET progress = ?, current_step = ? WHERE job_id = ?',
      [95, 'Merging clips into final video...', jobId]
    )
    
    let mergedVideoPath = null
    let mergedVideoUrl = null
    
    try {
      if (videoUrls.length > 1) {
        // Create output directory in public folder (accessible via URL)
        const outputDir = path.join(process.cwd(), 'public', 'merged-videos')
        await fs.mkdir(outputDir, { recursive: true })
        
        // Generate merged video filename
        const mergedFileName = `merged_${jobId}_${Date.now()}.mp4`
        mergedVideoPath = path.join(outputDir, mergedFileName)
        
        // Dynamically load video merger (server-side only)
        const { mergeVideos: doMerge, checkFFmpegAvailable: checkFFmpeg } = await loadVideoMerger()
        
        // Check if ffmpeg is available
        const ffmpegAvailable = await checkFFmpeg()
        
        if (ffmpegAvailable) {
          try {
            // Merge videos
            await doMerge(videoUrls, mergedVideoPath)
            
            // Generate public URL (relative to /public, accessible via browser)
            mergedVideoUrl = `/merged-videos/${mergedFileName}`
            
            console.log(`[Video Worker] Videos merged successfully: ${mergedVideoUrl}`)
            console.log(`[Video Worker] Merged video path: ${mergedVideoPath}`)
          } catch (mergeError) {
            console.error(`[Video Worker] FFmpeg merge failed:`, mergeError)
            // Fallback: use first video
            console.warn(`[Video Worker] Using first video as fallback due to merge error`)
            mergedVideoUrl = videoUrls[0]
          }
        } else {
          // If ffmpeg not available, use first video
          console.warn(`[Video Worker] FFmpeg not available, using first video`)
          mergedVideoUrl = videoUrls[0]
        }
      } else {
        // If only one clip, use it directly
        console.log(`[Video Worker] Single clip, using directly`)
        mergedVideoUrl = videoUrls[0]
      }
    } catch (mergeError) {
      console.error(`[Video Worker] Error merging videos:`, mergeError)
      // Fallback: use first video if merge fails
      mergedVideoUrl = videoUrls[0]
      console.warn(`[Video Worker] Using first video as fallback: ${mergedVideoUrl}`)
    }
    
    // Step 5: Mark job as completed with merged video
    const finalProgress = 100
    
    // Store scenes with merged video URL as a property (not in array)
    const scenesData = {
      mergedVideoUrl: mergedVideoUrl,
      mergedVideoPath: mergedVideoPath,
      individualClips: scenes, // Keep individual clips for reference but don't expose to user
      scenesCount: completedScenes.length
    }
    
    await queryDB(
      `UPDATE generation_jobs 
       SET status = ?, progress = ?, current_step = ?, scenes = ?, completed_at = NOW() 
       WHERE job_id = ?`,
      [
        'completed',
        finalProgress,
        `Completed: ${completedScenes.length}/${scenesCount} scenes merged into one video`,
        JSON.stringify(scenesData),
        jobId
      ]
    )
    
    console.log(`[Video Worker] Job ${jobId} completed: ${completedScenes.length}/${scenesCount} scenes merged into: ${mergedVideoUrl}`)
    
  } catch (error) {
    console.error(`[Video Worker] Error processing job ${jobId}:`, error)
    
    // Mark job as failed
    await queryDB(
      `UPDATE generation_jobs 
       SET status = ?, error_message = ?, error_details = ?, current_step = ? 
       WHERE job_id = ?`,
      [
        'failed',
        error.message || 'Generation failed',
        JSON.stringify({ error: error.message, stack: error.stack }),
        'Failed',
        jobId
      ]
    )
  }
}

/**
 * Create a Luma video generation
 * @param {string} prompt - Video generation prompt
 * @param {string} lumaApiKey - Luma API key
 * @param {string} previousGenerationId - Previous generation ID for continuation (clips 2-7)
 * @returns {Promise<Object>} Generation data
 */
async function createLumaGeneration(prompt, lumaApiKey, previousGenerationId = null) {
  const requestBody = {
    prompt: prompt,
    model: DEFAULT_MODEL,
    aspect_ratio: '16:9',
    duration: DURATION,
    resolution: DEFAULT_RESOLUTION,
    // Audio is OFF by default (Luma API doesn't support explicit audio:false, but doesn't add audio unless requested)
  }
  
  // For clips 2-7: Use continuation mechanism to maintain story continuity
  if (previousGenerationId) {
    requestBody.keyframes = {
      frame1: {
        type: 'generation',
        id: previousGenerationId
      }
    }
    console.log(`[Video Worker] Using continuation with previous generation: ${previousGenerationId}`)
  }
  
  const response = await fetch(`${LUMA_API_BASE}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lumaApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorDetail = errorText
    try {
      const errorData = JSON.parse(errorText)
      errorDetail = errorData.detail || errorData.message || errorData.error || errorText
    } catch {
      // Keep original text
    }
    throw new Error(`Luma API error (${response.status}): ${errorDetail}`)
  }
  
  return await response.json()
}

/**
 * Poll Luma generation status with progress updates
 * @param {string} generationId - Luma generation ID
 * @param {string} lumaApiKey - Luma API key
 * @param {string} jobId - Job ID for progress updates
 * @param {number} sceneIndex - Current scene index
 * @param {number} scenesCount - Total scenes count
 * @param {number} maxAttempts - Maximum polling attempts
 * @returns {Promise<Object>} Poll result with success and videoUrl
 */
async function pollLumaGeneration(generationId, lumaApiKey, jobId, sceneIndex, scenesCount, maxAttempts = 60) {
  const statusUrl = `${LUMA_API_BASE}/generations/${generationId}`
  let attempts = 0
  let delay = 3000 // Start with 3 seconds (faster)
  const baseProgress = 10 + Math.floor(((sceneIndex - 1) / scenesCount) * 80) // Progress for this scene
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lumaApiKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        const state = statusData.state
        
        // Update progress more frequently during polling
        const pollingProgress = baseProgress + Math.floor((attempts / maxAttempts) * (80 / scenesCount))
        await queryDB(
          'UPDATE generation_jobs SET progress = ?, current_step = ? WHERE job_id = ?',
          [
            Math.min(pollingProgress, baseProgress + (80 / scenesCount) - 1),
            `Scene ${sceneIndex}/${scenesCount}: ${state === 'queued' ? 'Queued...' : state === 'dreaming' ? 'Generating...' : 'Processing...'}`,
            jobId
          ]
        )
        
        if (state === 'completed') {
          const videoUrl = statusData.assets?.video
          if (videoUrl) {
            return { success: true, videoUrl }
          }
        } else if (state === 'failed') {
          const failureReason = statusData.failure_reason || 'Unknown error'
          return { success: false, error: `Generation failed: ${failureReason}` }
        }
        // Continue polling if 'queued' or 'dreaming'
      } else {
        const errorText = await statusResponse.text()
        console.error(`[Video Worker] Status check failed: ${statusResponse.status} - ${errorText}`)
      }
    } catch (err) {
      console.error(`[Video Worker] Status check error:`, err.message)
    }
    
    attempts++
    // Faster backoff: 3s, 4s, 5s, then cap at 5s (instead of 15s)
    delay = Math.min(5000, 3000 + (attempts * 500))
  }
  
  return { success: false, error: 'Generation timeout - took too long' }
}
