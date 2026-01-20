/**
 * Runway Long Video Generator
 * Generates videos longer than 10 seconds by using multiple clips
 * Note: Runway maxes at 10s per clip, so we generate multiple clips
 * This is a temporary solution until Runway adds native long video support
 */

import { getVideoProvider } from './index'
import type { VideoGenerationInput, VideoGenerationResult } from './provider'

// Note: Runway veo3.1 supports max 8s per clip, gen3a/gen4 support 10s
// We'll use 8s as the default to work with veo3.1
const MAX_DURATION_PER_CLIP = 8 // Runway veo3.1 maximum (gen3a/gen4 support 10s)
const TARGET_DURATION = 60 // 1 minute target
const CLIPS_NEEDED = Math.ceil(TARGET_DURATION / MAX_DURATION_PER_CLIP) // 8 clips of 8s each = 64s

export interface LongVideoGenerationOptions {
  prompt: string
  targetDurationSeconds?: number // Defaults to 60s
  aspectRatio?: string
  onProgress?: (progress: {
    clipNumber: number
    totalClips: number
    status: string
    progress: number
  }) => void
}

export interface LongVideoResult {
  jobId: string // Main job ID (first clip's job ID)
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  videoUrl?: string // Final merged video URL (if applicable)
  clips: Array<{
    jobId: string
    videoUrl?: string
    duration: number
    status: string
  }>
  totalDuration: number
  error?: string
}

/**
 * Generate a long video (60s) using Runway
 * Since Runway maxes at 10s per clip, we generate multiple clips sequentially
 * TODO: Replace with Runway's native extend API when available
 */
export async function generateLongVideo(
  options: LongVideoGenerationOptions
): Promise<LongVideoResult> {
  const provider = getVideoProvider()
  const targetDuration = options.targetDurationSeconds || TARGET_DURATION
  const clipsNeeded = Math.ceil(targetDuration / MAX_DURATION_PER_CLIP)
  
  const clips: LongVideoResult['clips'] = []
  let previousClipUrl: string | undefined
  let mainJobId: string | undefined

  // Generate clips sequentially
  for (let i = 0; i < clipsNeeded; i++) {
    const clipNumber = i + 1
    const isFirstClip = i === 0
    
    // Update progress
    options.onProgress?.({
      clipNumber,
      totalClips: clipsNeeded,
      status: `Generating clip ${clipNumber}/${clipsNeeded}...`,
      progress: Math.floor((i / clipsNeeded) * 80), // 0-80% for generation
    })

    try {
      // Build prompt for this clip
      let clipPrompt = options.prompt
      if (!isFirstClip && previousClipUrl) {
        // For subsequent clips, add continuation context
        clipPrompt = `${options.prompt} Continuing from previous scene, maintaining visual consistency.`
      }

      // Generate clip with max duration for the model
      // veo3.1 supports 4/6/8s, gen3a/gen4 support 5/10s
      const input: VideoGenerationInput = {
        prompt: clipPrompt,
        durationSeconds: MAX_DURATION_PER_CLIP, // Will be validated and adjusted by provider
        aspectRatio: options.aspectRatio || '16:9',
        // Note: Runway doesn't have a direct continuation mechanism like Luma's keyframes
        // So we generate independent clips and rely on prompt consistency
        // TODO: Use Runway's extend API when available
      }

      const { jobId } = await provider.generateVideo(input)
      
      if (isFirstClip) {
        mainJobId = jobId
      }

      // Poll for completion
      let clipResult: VideoGenerationResult
      let attempts = 0
      const maxAttempts = 120 // 10 minutes max per clip (5s intervals)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        clipResult = await provider.getJob(jobId)
        
        if (clipResult.status === 'succeeded') {
          if (clipResult.videoUrl) {
            previousClipUrl = clipResult.videoUrl
            clips.push({
              jobId,
              videoUrl: clipResult.videoUrl,
              duration: MAX_DURATION_PER_CLIP,
              status: 'succeeded',
            })
            break
          } else {
            throw new Error(`Clip ${clipNumber} completed but no video URL`)
          }
        } else if (clipResult.status === 'failed') {
          throw new Error(`Clip ${clipNumber} failed: ${clipResult.error || 'Unknown error'}`)
        }

        // Update progress during polling
        const pollingProgress = Math.floor((i / clipsNeeded) * 80) + Math.floor((attempts / maxAttempts) * (80 / clipsNeeded))
        options.onProgress?.({
          clipNumber,
          totalClips: clipsNeeded,
          status: `Waiting for clip ${clipNumber} to complete...`,
          progress: Math.min(pollingProgress, 80),
        })

        attempts++
      }

      if (!clipResult || clipResult.status !== 'succeeded') {
        throw new Error(`Clip ${clipNumber} timed out or failed`)
      }

    } catch (error: any) {
      console.error(`[Runway Long Video] Error generating clip ${clipNumber}:`, error)
      
      // If first clip fails, fail entire generation
      if (isFirstClip) {
        return {
          jobId: mainJobId || 'unknown',
          status: 'failed',
          clips: [],
          totalDuration: 0,
          error: `Failed to generate first clip: ${error.message}`,
        }
      }

      // For subsequent clips, log error but continue
      clips.push({
        jobId: `failed_${clipNumber}`,
        videoUrl: undefined,
        duration: 0,
        status: 'failed',
      })
    }
  }

  // All clips generated successfully
  const successfulClips = clips.filter(c => c.status === 'succeeded' && c.videoUrl)
  const totalDuration = successfulClips.length * MAX_DURATION_PER_CLIP

  // Return all clips - the worker will handle merging or returning the first one
  // TODO: When Runway adds native extend/merge API, use that instead
  // For now, we generate multiple clips and return them all
  // The video worker can merge them server-side or return them individually

  return {
    jobId: mainJobId!,
    status: successfulClips.length > 0 ? 'succeeded' : 'failed',
    videoUrl: successfulClips.length > 0 ? successfulClips[0]?.videoUrl : undefined, // Return first clip as primary URL
    clips: successfulClips, // Return all successful clips
    totalDuration,
    error: successfulClips.length < clipsNeeded 
      ? `Only ${successfulClips.length}/${clipsNeeded} clips generated successfully`
      : undefined,
  }
}
