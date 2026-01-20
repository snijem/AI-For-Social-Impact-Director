/**
 * Video Provider Interface
 * Abstraction layer for video generation providers (Runway, Luma, etc.)
 */

export type VideoJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface VideoGenerationInput {
  prompt: string
  durationSeconds?: number // Optional duration in seconds (defaults to provider default)
  aspectRatio?: string // e.g., '16:9', '1280:720'
  resolution?: string // e.g., '540p', '720p', '1080p'
  previousGenerationId?: string // For continuation/extending videos
  model?: string // Optional model override (e.g., 'gen3a_turbo', 'veo3.1')
  [key: string]: any // Allow additional provider-specific params
}

export interface VideoGenerationResult {
  jobId: string
  status: VideoJobStatus
  progress?: number // 0-100
  videoUrl?: string
  error?: string
  metadata?: {
    duration?: number
    model?: string
    resolution?: string
    [key: string]: any
  }
}

export interface VideoProvider {
  /**
   * Generate a video from a prompt
   * @param input Generation parameters
   * @returns Promise resolving to job ID
   */
  generateVideo(input: VideoGenerationInput): Promise<{ jobId: string }>

  /**
   * Get the status of a video generation job
   * @param jobId Job ID returned from generateVideo
   * @returns Promise resolving to job status and result
   */
  getJob(jobId: string): Promise<VideoGenerationResult>

  /**
   * Extend an existing video (if supported)
   * @param assetId Asset ID of the video to extend
   * @param prompt Prompt for the extension
   * @param durationSeconds Duration to extend
   * @returns Promise resolving to new job ID
   */
  extendVideo?(assetId: string, prompt: string, durationSeconds: number): Promise<{ jobId: string }>

  /**
   * Get the maximum duration supported per clip
   */
  getMaxDurationPerClip(): number

  /**
   * Check if provider supports native long videos (without stitching)
   */
  supportsNativeLongVideos(): boolean
}
