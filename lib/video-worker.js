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
    
    // Create or update user_videos record with 'processing' status if user_id exists
    if (job.user_id) {
      try {
        // Check if a video record already exists for this job
        const existingVideos = await queryDB(
          `SELECT id FROM user_videos 
           WHERE user_id = ? AND script = ? AND status IN ('draft', 'processing')
           ORDER BY created_at DESC LIMIT 1`,
          [job.user_id, job.script.trim()]
        )
        
        if (!existingVideos || existingVideos.length === 0) {
          // Create new draft video record
          await queryDB(
            `INSERT INTO user_videos (user_id, script, generation_id, status)
             VALUES (?, ?, ?, ?)`,
            [
              job.user_id,
              job.script.trim(),
              jobId,
              'processing'
            ]
          )
          console.log(`[Video Worker] Created draft user_videos record for job ${jobId}`)
        } else {
          // Update existing record to processing
          await queryDB(
            `UPDATE user_videos 
             SET status = 'processing', generation_id = ?, updated_at = NOW()
             WHERE id = ?`,
            [jobId, existingVideos[0].id]
          )
          console.log(`[Video Worker] Updated user_videos record ${existingVideos[0].id} to processing`)
        }
      } catch (videoCreateError) {
        // Log error but don't fail the job
        console.error('[Video Worker] Error creating/updating user_videos record:', videoCreateError)
      }
    }
    
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
    
    // Step 6: Save video to user_videos table if user_id exists
    if (job.user_id) {
      try {
        // Find the video record for this job (should exist from when we created it at start)
        const existingVideos = await queryDB(
          `SELECT id FROM user_videos 
           WHERE user_id = ? AND (generation_id = ? OR (script = ? AND status IN ('draft', 'processing')))
           ORDER BY created_at DESC LIMIT 1`,
          [job.user_id, jobId, job.script.trim()]
        )
        
        let videoId = null
        
        if (existingVideos && existingVideos.length > 0) {
          // Update existing video record
          videoId = existingVideos[0].id
          await queryDB(
            `UPDATE user_videos 
             SET video_url = ?, status = ?, storyboard = ?, video_data = ?, generation_id = ?, updated_at = NOW()
             WHERE id = ?`,
            [
              mergedVideoUrl,
              'completed',
              JSON.stringify(storyboard),
              JSON.stringify(scenesData),
              jobId,
              videoId
            ]
          )
          console.log(`[Video Worker] Updated user_videos record ${videoId} with video URL and completed status`)
        } else {
          // Fallback: Create new video record if somehow it doesn't exist
          const result = await queryDB(
            `INSERT INTO user_videos (user_id, script, video_url, generation_id, status, storyboard, video_data)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              job.user_id,
              job.script.trim(),
              mergedVideoUrl,
              jobId,
              'completed',
              JSON.stringify(storyboard),
              JSON.stringify(scenesData)
            ]
          )
          videoId = result.insertId
          console.log(`[Video Worker] Created user_videos record ${videoId} with video URL (fallback)`)
        }
        
        // Also save to result_links table
        if (videoId && mergedVideoUrl) {
          try {
            const title = storyboard?.title || job.script.split('\n')[0]?.substring(0, 255) || 'Generated Video'
            const description = storyboard?.summary || job.script.substring(0, 500) || null
            
            // Check if result link already exists
            const existingLinks = await queryDB(
              `SELECT id FROM result_links WHERE video_id = ? AND result_url = ?`,
              [videoId, mergedVideoUrl]
            )
            
            if (!existingLinks || existingLinks.length === 0) {
              await queryDB(
                `INSERT INTO result_links (user_id, video_id, result_url, title, description, status)
                 VALUES (?, ?, ?, ?, ?, 'active')`,
                [
                  job.user_id,
                  videoId,
                  mergedVideoUrl.trim(),
                  title,
                  description,
                ]
              )
              console.log(`[Video Worker] Created result_links record for video ${videoId}`)
            }
          } catch (linkError) {
            // Log error but don't fail the video save
            console.error('[Video Worker] Error saving result link:', linkError)
          }
        }
      } catch (videoSaveError) {
        // Log error but don't fail the job completion
        console.error('[Video Worker] Error saving video to user_videos:', videoSaveError)
      }
    } else {
      console.log(`[Video Worker] No user_id for job ${jobId}, skipping user_videos save`)
    }
    
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
    
    // Update user_videos record to failed status if it exists
    try {
      const jobs = await queryDB(
        'SELECT user_id, script FROM generation_jobs WHERE job_id = ?',
        [jobId]
      )
      
      if (jobs && jobs.length > 0 && jobs[0].user_id) {
        const job = jobs[0]
        await queryDB(
          `UPDATE user_videos 
           SET status = 'failed', updated_at = NOW()
           WHERE user_id = ? AND (generation_id = ? OR (script = ? AND status IN ('draft', 'processing')))
           ORDER BY created_at DESC LIMIT 1`,
          [job.user_id, jobId, job.script.trim()]
        )
        console.log(`[Video Worker] Updated user_videos record to failed status for job ${jobId}`)
      }
    } catch (videoUpdateError) {
      // Log error but don't fail
      console.error('[Video Worker] Error updating user_videos to failed:', videoUpdateError)
    }
  }
}

// Legacy Luma functions removed - now using Runway provider
