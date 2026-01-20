/**
 * Video Provider Export
 * Exports the selected video provider (Runway)
 */

import { RunwayProvider } from './runway'
import type { VideoProvider } from './provider'

// Export the provider interface
export type { VideoProvider, VideoGenerationInput, VideoGenerationResult, VideoJobStatus } from './provider'

// Create and export the active provider instance
let providerInstance: VideoProvider | null = null

export function getVideoProvider(): VideoProvider {
  if (!providerInstance) {
    try {
      providerInstance = new RunwayProvider()
    } catch (error: any) {
      console.error('[Video Provider] Failed to initialize Runway provider:', error)
      throw new Error(`Video provider initialization failed: ${error.message}`)
    }
  }
  return providerInstance
}

// Export provider class for testing
export { RunwayProvider }
