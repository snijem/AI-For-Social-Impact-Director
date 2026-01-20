/**
 * Background Video Generation Worker
 * Processes generation jobs asynchronously
 * Now uses Runway ML API for video generation
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

// Runway configuration
// Generate single 8-second video (veo3.1_fast max duration)
const DEFAULT_DURATION_SECONDS = 8 // 8 seconds per video

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
    
    // Ensure scenes count > 0
    if (!storyboard.scenes || storyboard.scenes.length === 0) {
      console.warn(`[Video Worker] Storyboard has 0 scenes, using fallback`)
      const fallback = generateStoryboard(job.script)
      storyboard.scenes = fallback.scenes
    }
    
    // For 60s video, we'll generate one continuous video, so scenes count is 1
    const scenesCount = 1
    
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
    
    // Step 3: Generate single 8-second video using Runway
      await queryDB(
        'UPDATE generation_jobs SET progress = ?, current_step = ? WHERE job_id = ?',
      [20, 'Generating 8-second video with Runway...', jobId]
    )
    
    console.log(`[Video Worker] Starting Runway video generation for job: ${jobId}`)
    console.log(`[Video Worker] Target: Single ${DEFAULT_DURATION_SECONDS}-second video`)
    
    // Dynamically import Runway provider (ESM)
    // Import TypeScript file - Next.js will handle compilation
    const videoModule = await import('@/lib/video/index')
    const { getVideoProvider } = videoModule
    const provider = getVideoProvider()
    
    // Build main video prompt from story context
    const mainScene = storyboard.scenes[0] || { description: job.script.substring(0, 500) }
        const videoPrompt = buildContextualPrompt(
          storyContext,
      mainScene.description,
      1,
      false
    )
    
    console.log(`[Video Worker] Video prompt:`, videoPrompt.substring(0, 200) + '...')
    
    let mergedVideoUrl = null
    let scenes = []
    let lastProgressUpdate = 20 // Track last progress to prevent glitching
    let blackFrameAppended = false // Track if black frame was successfully appended
    
    try {
      // Generate single 8-second video using Runway
      const { jobId: videoJobId } = await provider.generateVideo({
          prompt: videoPrompt,
        durationSeconds: DEFAULT_DURATION_SECONDS,
        aspectRatio: '16:9',
      })
      
      console.log(`[Video Worker] Video generation started: ${videoJobId}`)
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 120 // 10 minutes max
      let videoResult
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        videoResult = await provider.getJob(videoJobId)
        
        // Update progress (prevent backwards progress to fix glitch)
        const progressPercent = videoResult.progress || 50
        const jobProgress = 20 + Math.floor((progressPercent / 100) * 70)
        
        if (jobProgress > lastProgressUpdate) {
          lastProgressUpdate = jobProgress
        await queryDB(
            'UPDATE generation_jobs SET progress = ?, current_step = ? WHERE job_id = ?',
            [
              jobProgress,
              videoResult.status === 'running' ? 'Generating video...' : `Status: ${videoResult.status}`,
              jobId
            ]
          )
        }
        
        if (videoResult.status === 'succeeded') {
          if (videoResult.videoUrl) {
            mergedVideoUrl = videoResult.videoUrl
            break
          } else {
            throw new Error('Video generation completed but no video URL')
          }
        } else if (videoResult.status === 'failed') {
          throw new Error(videoResult.error || 'Video generation failed')
        }
        
        attempts++
      }
      
      if (!videoResult || videoResult.status !== 'succeeded' || !mergedVideoUrl) {
        throw new Error('Video generation timed out or failed')
      }
      
      // Store as single scene (it's one 8-second video)
      scenes = [{
        sceneIndex: 1,
        sceneNumber: 1,
        prompt: videoPrompt,
        videoUrl: mergedVideoUrl,
        generationId: videoJobId,
        description: mainScene.description,
        duration: DEFAULT_DURATION_SECONDS,
      }]
      
      console.log(`[Video Worker] Runway video generation completed: ${mergedVideoUrl}`)
      console.log(`[Video Worker] Generated single ${DEFAULT_DURATION_SECONDS}-second video`)
      
      // Step 3.5: Append 1-second black frame to make it 9 seconds total
      console.log(`[Video Worker] Appending 1-second black frame to make 9-second video...`)
      try {
    await queryDB(
      'UPDATE generation_jobs SET progress = ?, current_step = ? WHERE job_id = ?',
          [85, 'Appending black frame for 9-second output...', jobId]
        )

        // Call the append-black-frame API
        const appendResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/append-black-frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl: mergedVideoUrl }),
        })

        if (appendResponse.ok) {
          const appendData = await appendResponse.json()
          if (appendData.success && appendData.videoUrl) {
            mergedVideoUrl = appendData.videoUrl
            blackFrameAppended = true
            console.log(`[Video Worker] Successfully appended black frame. Final video (9s): ${mergedVideoUrl}`)
          } else {
            console.warn(`[Video Worker] Append black frame returned success=false, using original 8s video:`, appendData.error)
            // Fallback to original video - continue with mergedVideoUrl unchanged
          }
        } else {
          console.warn(`[Video Worker] Append black frame API failed (${appendResponse.status}), using original 8s video`)
          // Fallback to original video - continue with mergedVideoUrl unchanged
        }
      } catch (appendError) {
        console.error(`[Video Worker] Error appending black frame, using original 8s video:`, appendError.message)
        // Fallback to original video - continue with mergedVideoUrl unchanged
      }
      
    } catch (runwayError) {
      console.error(`[Video Worker] Error generating Runway video:`, runwayError)
      throw runwayError
    }
    
    // Step 4: Video is already generated by Runway (no merging needed)
    const completedScenes = scenes.filter(s => s.videoUrl)
    
    if (!mergedVideoUrl) {
      throw new Error('No video generated')
    }
    
    console.log(`[Video Worker] Video generation completed: ${mergedVideoUrl}`)
    
    // Step 5: Mark job as completed
    const finalProgress = 100
    
    // Final duration is 9 seconds (8s Runway video + 1s black frame)
    // But use original 8s duration if black frame append failed
    // Use blackFrameAppended flag to determine final duration
    const finalDuration = blackFrameAppended ? 9 : DEFAULT_DURATION_SECONDS
    
      // Store video data
    const scenesData = {
      mergedVideoUrl: mergedVideoUrl,
      individualClips: scenes, // Keep individual clips for reference
      scenesCount: completedScenes.length,
      totalDuration: finalDuration, // 9 seconds if black frame was appended, otherwise 8 seconds
      provider: 'runway',
      model: 'runway-ml'
    }
    
    await queryDB(
      `UPDATE generation_jobs 
       SET status = ?, progress = ?, current_step = ?, scenes = ?, completed_at = NOW() 
       WHERE job_id = ?`,
      [
        'completed',
        finalProgress,
        `Completed: ${finalDuration}-second video generated with Runway`,
        JSON.stringify(scenesData),
        jobId
      ]
    )
    
    console.log(`[Video Worker] Job ${jobId} completed: ${finalDuration}-second video generated: ${mergedVideoUrl}`)
    
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

// Legacy Luma functions removed - now using Runway provider
