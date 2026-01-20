/**
 * Runway Video Extender
 * Generates a single long video by extending an initial clip multiple times
 * Uses Runway's extend API to create one continuous video
 */

import { getVideoProvider } from './index'
import type { VideoGenerationResult } from './provider'

// Note: Runway extend API limitations:
// - gen3a_turbo: max 34s total (10s initial + 3 extensions of 8s)
// - gen3a: max 40s total (10s initial + 3 extensions of 5-10s)
// - veo3.1: does NOT support extend API
// We'll use gen3a_turbo for initial generation and extending to get closest to 60s
const INITIAL_DURATION = 10 // Start with 10s clip (gen3a_turbo max for better extend support)
const EXTEND_DURATION = 8 // Extend by 8s each time (gen3a_turbo supports 8s extensions)
const TARGET_DURATION = 60 // 1 minute target
const MAX_EXTENSIONS = 3 // Runway allows max 3 extensions per video
const MAX_TOTAL_DURATION = INITIAL_DURATION + (MAX_EXTENSIONS * EXTEND_DURATION) // 10 + 24 = 34s max

export interface ExtendVideoOptions {
  prompt: string
  targetDurationSeconds?: number // Defaults to 60s
  aspectRatio?: string
  onProgress?: (progress: {
    step: string
    currentDuration: number
    targetDuration: number
    progress: number
  }) => void
}

export interface ExtendedVideoResult {
  jobId: string // Final extended video job ID
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  videoUrl?: string // Final extended video URL
  totalDuration: number
  extensions: number
  error?: string
}

/**
 * Generate a single 60-second video by extending an initial clip
 * This creates ONE continuous video, not multiple clips
 */
export async function generateExtendedVideo(
  options: ExtendVideoOptions
): Promise<ExtendedVideoResult> {
  const provider = getVideoProvider()
  const targetDuration = options.targetDurationSeconds || TARGET_DURATION
  
  // Check if provider supports extend
  if (!provider.extendVideo) {
    throw new Error('Runway provider does not support video extension')
  }

  options.onProgress?.({
    step: 'Generating initial clip...',
    currentDuration: 0,
    targetDuration,
    progress: 5,
  })

  // Step 1: Generate initial clip (10s using gen3a_turbo for extend support)
  // Note: We need to use gen3a_turbo instead of veo3.1 because veo3.1 doesn't support extend
  const initialResult = await provider.generateVideo({
    prompt: options.prompt,
    durationSeconds: INITIAL_DURATION,
    aspectRatio: options.aspectRatio || '16:9',
    model: 'gen3a_turbo', // Use gen3a_turbo for extend support
  })

  let currentJobId = initialResult.jobId
  let currentDuration = INITIAL_DURATION
  let assetId: string | undefined

  // Step 2: Wait for initial clip to complete
  options.onProgress?.({
    step: 'Waiting for initial clip...',
    currentDuration: 0,
    targetDuration,
    progress: 10,
  })

  let attempts = 0
  const maxAttempts = 120 // 10 minutes max
  let initialVideoResult: VideoGenerationResult | undefined

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    
    initialVideoResult = await provider.getJob(currentJobId)
    
    if (initialVideoResult.status === 'succeeded') {
      if (initialVideoResult.videoUrl) {
        assetId = initialVideoResult.metadata?.assetId || currentJobId
        currentDuration = INITIAL_DURATION
        break
      } else {
        throw new Error('Initial clip completed but no video URL')
      }
    } else if (initialVideoResult.status === 'failed') {
      throw new Error(`Initial clip failed: ${initialVideoResult.error || 'Unknown error'}`)
    }

    options.onProgress?.({
      step: 'Waiting for initial clip...',
      currentDuration: 0,
      targetDuration,
      progress: 10 + Math.floor((attempts / maxAttempts) * 10),
    })

    attempts++
  }

  if (!initialVideoResult || initialVideoResult.status !== 'succeeded' || !assetId) {
    throw new Error('Initial clip generation failed or timed out')
  }

  // Step 3: Extend the video multiple times to reach target duration
  // Note: Runway limits extensions to 3 times max, so we can get up to 34s total
  let extensionCount = 0
  const neededExtensions = Math.min(
    MAX_EXTENSIONS, // Runway max is 3 extensions
    Math.ceil((targetDuration - INITIAL_DURATION) / EXTEND_DURATION)
  )

  while (currentDuration < targetDuration && extensionCount < neededExtensions) {
    extensionCount++
    const remainingDuration = targetDuration - currentDuration
    const extendBy = Math.min(EXTEND_DURATION, remainingDuration)
    
    // Don't extend if we're already at max total duration
    if (currentDuration + extendBy > MAX_TOTAL_DURATION) {
      console.log(`[Runway Extend] Reached max total duration (${MAX_TOTAL_DURATION}s), stopping extensions`)
      break
    }

    options.onProgress?.({
      step: `Extending video (${extensionCount}/${neededExtensions})...`,
      currentDuration,
      targetDuration,
      progress: 20 + Math.floor((extensionCount / neededExtensions) * 70),
    })

    try {
      // Extend the video with continuation prompt
      // For extensions, focus on movement/continuation rather than re-describing the scene
      const extendPrompt = `Continuing the scene smoothly, maintaining the same visual style and motion.`
      const extendResult = await provider.extendVideo!(assetId, extendPrompt, extendBy)

      // Wait for extension to complete
      let extendAttempts = 0
      let extendVideoResult: VideoGenerationResult | undefined

      while (extendAttempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        extendVideoResult = await provider.getJob(extendResult.jobId)
        
        if (extendVideoResult.status === 'succeeded') {
          if (extendVideoResult.videoUrl) {
            // For extend API, the new video URL is the extended version
            // The asset ID might be the same or a new one - use the new job ID as asset ID
            // Update asset ID for next extension (use the new extended video's ID)
            assetId = extendVideoResult.metadata?.assetId || extendResult.jobId
            currentJobId = extendResult.jobId
            currentDuration += extendBy
            
            console.log(`[Runway Extend] Extension ${extensionCount} completed. New duration: ${currentDuration}s`)
            break
          } else {
            throw new Error(`Extension ${extensionCount} completed but no video URL`)
          }
        } else if (extendVideoResult.status === 'failed') {
          throw new Error(`Extension ${extensionCount} failed: ${extendVideoResult.error || 'Unknown error'}`)
        }

        extendAttempts++
      }

      if (!extendVideoResult || extendVideoResult.status !== 'succeeded') {
        throw new Error(`Extension ${extensionCount} timed out or failed`)
      }

    } catch (extendError: any) {
      console.error(`[Runway Extend] Error in extension ${extensionCount}:`, extendError)
      // If extension fails, return what we have so far
      if (extensionCount === 1) {
        throw new Error(`Failed to extend video: ${extendError.message}`)
      }
      // If we have at least one successful extension, continue with what we have
      break
    }
  }

  // Get final video result
  const finalResult = await provider.getJob(currentJobId)

  return {
    jobId: currentJobId,
    status: finalResult.status,
    videoUrl: finalResult.videoUrl,
    totalDuration: currentDuration,
    extensions: extensionCount,
    error: finalResult.error,
  }
}
