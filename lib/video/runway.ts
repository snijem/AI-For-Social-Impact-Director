/**
 * Runway ML Video Provider Implementation
 * Uses Runway ML API for video generation
 */

import RunwayML from '@runwayml/sdk'
import type { VideoProvider, VideoGenerationInput, VideoGenerationResult, VideoJobStatus } from './provider'

const RUNWAY_API_VERSION = '2024-11-06'
// Model-specific duration limits:
// - veo3.1: supports 4, 6, or 8 seconds
// - veo3.1_fast: supports 4, 6, or 8 seconds
// - gen3a_turbo: supports 5 or 10 seconds
// - gen4_turbo: supports 5 or 10 seconds
const DEFAULT_MODEL = 'veo3.1_fast'
const DEFAULT_DURATION = 8 // veo3.1_fast max is 8s per clip
const DEFAULT_RATIO = '1280:720' // 16:9 aspect ratio

// Allowed durations per model
const MODEL_DURATIONS: Record<string, number[]> = {
  'veo3.1': [4, 6, 8],
  'veo3.1_fast': [4, 6, 8],
  'gen3a_turbo': [5, 10],
  'gen4_turbo': [5, 10],
}

// Map Runway task status to our status
// Runway SDK returns uppercase statuses: PENDING, RUNNING, SUCCEEDED, FAILED
function mapRunwayStatus(runwayStatus: string): VideoJobStatus {
  const status = runwayStatus?.toUpperCase() || 'PENDING'
  switch (status) {
    case 'PENDING':
    case 'QUEUED':
      return 'queued'
    case 'RUNNING':
    case 'PROCESSING':
      return 'running'
    case 'SUCCEEDED':
    case 'COMPLETED':
      return 'succeeded'
    case 'FAILED':
    case 'ERROR':
      return 'failed'
    default:
      return 'queued'
  }
}

export class RunwayProvider implements VideoProvider {
  private client: RunwayML
  private apiKey: string

  constructor() {
    // Check for RUNAWAY_API_KEY (user's env var) or RUNWAYML_API_SECRET (SDK default)
    const apiKey = process.env.RUNAWAY_API_KEY || process.env.RUNWAYML_API_SECRET
    if (!apiKey) {
      throw new Error('RUNAWAY_API_KEY or RUNWAYML_API_SECRET is not configured in environment variables')
    }
    this.apiKey = apiKey
    // SDK automatically uses RUNWAYML_API_SECRET env var, but we can also pass it explicitly
    this.client = new RunwayML({ apiKey })
  }

  getMaxDurationPerClip(): number {
    const allowedDurations = MODEL_DURATIONS[DEFAULT_MODEL] || [4, 6, 8]
    return Math.max(...allowedDurations) // Return max allowed duration for current model
  }

  supportsNativeLongVideos(): boolean {
    return false // Runway max is 10s, need to use continuation for longer videos
  }

  async generateVideo(input: VideoGenerationInput): Promise<{ jobId: string }> {
    try {
      // Allow model override (e.g., for extend support we need gen3a_turbo)
      const model = input.model || DEFAULT_MODEL
      const allowedDurations = MODEL_DURATIONS[model] || MODEL_DURATIONS[DEFAULT_MODEL] || [4, 6, 8]
      const maxDuration = Math.max(...allowedDurations)
      
      // Get requested duration or use default
      let requestedDuration = input.durationSeconds || maxDuration
      
      // Find the closest allowed duration that's <= requested duration
      const duration = allowedDurations
        .filter(d => d <= requestedDuration)
        .sort((a, b) => b - a)[0] || allowedDurations[allowedDurations.length - 1]

      // Validate duration is in allowed list
      if (!allowedDurations.includes(duration)) {
        throw new Error(
          `Duration ${duration}s is not supported for model ${model}. ` +
          `Allowed durations: ${allowedDurations.join(', ')}s`
        )
      }

      // Build prompt - enhance it for better results
      const enhancedPrompt = this.enhancePrompt(input.prompt)

      // Create text-to-video generation task using Runway SDK
      // Ensure duration is an integer and is in the allowed list
      const finalDuration = Math.round(duration)
      
      console.log(`[Runway Provider] Creating video with model: ${model}, duration: ${finalDuration}s`)
      
      const task = await this.client.textToVideo.create({
        model: model,
        promptText: enhancedPrompt,
        duration: finalDuration,
        ratio: input.aspectRatio ? this.mapAspectRatio(input.aspectRatio) : DEFAULT_RATIO,
      })

      if (!task || !task.id) {
        throw new Error('Failed to create Runway generation task: No task ID returned')
      }

      return { jobId: String(task.id) }
    } catch (error: any) {
      console.error('[Runway Provider] Error generating video:', error)
      throw new Error(`Runway API error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Extend an existing video using Runway's extend API
   * Note: Extend is only supported for gen3a/gen3a_turbo models, not veo3.1/veo3.1_fast
   * @param assetId - The asset ID of the video to extend
   * @param prompt - Prompt for the extension
   * @param durationSeconds - Duration to extend (typically 8s for gen3a_turbo, 5 or 10s for gen3a)
   * @returns Promise with new job ID
   */
  async extendVideo(assetId: string, prompt: string, durationSeconds: number = 8): Promise<{ jobId: string }> {
    try {
      // Runway extend API - use videoExtend.create() method from SDK
      // Note: veo3.1/veo3.1_fast don't support extend, so we'll use gen3a_turbo for extending
      const extendModel = 'gen3a_turbo' // Use gen3a_turbo for extending (supports extend API)
      
      let task
      
      try {
        // Try SDK videoExtend method (if available in SDK version)
        if (this.client.videoExtend && this.client.videoExtend.create) {
          task = await this.client.videoExtend.create({
            model: extendModel,
            video: assetId, // Asset ID of video to extend
            promptText: prompt,
            duration: durationSeconds,
          })
        } else if (this.client.gen3 && this.client.gen3.extend) {
          // Alternative SDK method name
          task = await this.client.gen3.extend({
            assetId: assetId,
            promptText: prompt,
            duration: durationSeconds,
          })
        } else {
          // Use direct API call for extend (fallback)
          const response = await fetch('https://api.runwayml.com/v1/gen3/extend', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'X-Runway-Version': RUNWAY_API_VERSION,
            },
            body: JSON.stringify({
              model: extendModel,
              video: assetId, // Use 'video' parameter for extend API
              prompt_text: prompt,
              duration: durationSeconds,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Runway extend API error (${response.status}): ${errorText}`)
          }

          task = await response.json()
        }

        if (!task || !task.id) {
          throw new Error('Failed to create Runway extend task: No task ID returned')
        }

        console.log(`[Runway Provider] Extend task created: ${task.id} for asset ${assetId}`)
        return { jobId: String(task.id) }
      } catch (extendError: any) {
        console.error('[Runway Provider] Error extending video:', extendError)
        throw new Error(`Runway extend API error: ${extendError.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('[Runway Provider] Error in extendVideo:', error)
      throw error
    }
  }

  async getJob(jobId: string): Promise<VideoGenerationResult> {
    try {
      // Get task status using Runway SDK
      const task = await this.client.tasks.retrieve(jobId)

      if (!task) {
        return {
          jobId,
          status: 'failed',
          error: `Task ${jobId} not found`,
        }
      }

      // Map Runway status (uppercase) to our status
      const status = mapRunwayStatus(task.status || 'PENDING')
      const progress = this.calculateProgress(task)

      let videoUrl: string | undefined
      let error: string | undefined
      let assetId: string | undefined // Store asset ID for potential extending

      if (status === 'succeeded') {
        // Extract video URL and asset ID from task output
        // Runway SDK returns task.output as an array
        if (task.output && Array.isArray(task.output) && task.output.length > 0) {
          videoUrl = task.output[0] // First video URL
          // Asset ID might be in task.asset_id or task.id
          assetId = task.asset_id || task.id
        } else if (typeof task.output === 'string') {
          videoUrl = task.output
          assetId = task.asset_id || task.id
        }

        if (!videoUrl) {
          console.warn('[Runway Provider] Task succeeded but no video URL found:', task)
          error = 'Video generation completed but no video URL available'
        }
      } else if (status === 'failed') {
        // Extract error message from task
        error = task.error?.message || task.error || 'Video generation failed'
      }

      return {
        jobId,
        status,
        progress,
        videoUrl,
        error,
        metadata: {
          duration: task.duration || DEFAULT_DURATION,
          model: DEFAULT_MODEL,
          resolution: '720p', // Default for 1280:720
          assetId: assetId, // Include asset ID for extending
        },
      }
    } catch (error: any) {
      console.error('[Runway Provider] Error getting job status:', error)
      
      // If task not found, return failed status
      if (error.message?.includes('not found') || error.status === 404 || error.code === 'NOT_FOUND') {
        return {
          jobId,
          status: 'failed',
          error: `Task ${jobId} not found`,
        }
      }

      throw new Error(`Runway API error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Enhance prompt for better video generation results
   */
  private enhancePrompt(prompt: string): string {
    // Add cinematic and quality hints if not already present
    const lowerPrompt = prompt.toLowerCase()
    let enhanced = prompt

    if (!lowerPrompt.includes('cinematic') && !lowerPrompt.includes('high quality')) {
      enhanced = `${prompt}. Cinematic quality, smooth motion, high detail.`
    }

    return enhanced
  }

  /**
   * Map aspect ratio string to Runway format
   */
  private mapAspectRatio(ratio: string): string {
    // Runway uses explicit resolution strings like "1280:720" instead of "16:9"
    const ratioMap: Record<string, string> = {
      '16:9': '1280:720',
      '9:16': '720:1280',
      '1:1': '720:720',
      '4:3': '960:720',
      '3:4': '720:960',
      '21:9': '1920:720',
      '9:21': '720:1920',
    }

    return ratioMap[ratio] || DEFAULT_RATIO
  }

  /**
   * Calculate progress percentage from task status
   */
  private calculateProgress(task: any): number {
    // Runway doesn't always provide explicit progress, so estimate based on status
    const status = mapRunwayStatus(task.status || 'PENDING')
    switch (status) {
      case 'queued':
        return 10
      case 'running':
        return 50 // Middle of generation
      case 'succeeded':
        return 100
      case 'failed':
        return 0
      default:
        return 0
    }
  }
}
