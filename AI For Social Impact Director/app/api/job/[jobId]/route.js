import { NextResponse } from "next/server";
import { queryDB } from '../../../../lib/db'
import { setupDatabase } from '../../../../lib/setup-db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/job/:jobId
 * Returns job status for polling
 */
export async function GET(req, { params }) {
  try {
    await setupDatabase()
    
    const { jobId } = params
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }
    
    // Get job from database
    const jobs = await queryDB(
      'SELECT * FROM generation_jobs WHERE job_id = ?',
      [jobId]
    )
    
    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    const job = jobs[0]
    
    // Parse JSON fields
    let storyboard = null
    let scenes = []
    let errorDetails = null
    
    try {
      if (job.storyboard) {
        storyboard = typeof job.storyboard === 'string' 
          ? JSON.parse(job.storyboard) 
          : job.storyboard
      }
    } catch (e) {
      console.error('[Job API] Error parsing storyboard:', e)
    }
    
    try {
      if (job.scenes) {
        scenes = typeof job.scenes === 'string'
          ? JSON.parse(job.scenes)
          : job.scenes
      }
    } catch (e) {
      console.error('[Job API] Error parsing scenes:', e)
    }
    
    try {
      if (job.error_details) {
        errorDetails = typeof job.error_details === 'string'
          ? JSON.parse(job.error_details)
          : job.error_details
      }
    } catch (e) {
      console.error('[Job API] Error parsing error_details:', e)
    }
    
    // Extract merged video URL from scenes object (it's stored as a property, not in array)
    let mergedVideoUrl = null
    let individualScenes = []
    
    if (scenes && typeof scenes === 'object') {
      // Check if scenes has mergedVideoUrl property (when stored as object with mergedVideoUrl)
      if (scenes.mergedVideoUrl) {
        mergedVideoUrl = scenes.mergedVideoUrl
        individualScenes = Array.isArray(scenes.individualClips) ? scenes.individualClips : (Array.isArray(scenes) ? scenes : [])
      } else if (Array.isArray(scenes)) {
        // If it's an array, extract video URLs but we'll hide them
        individualScenes = scenes
        // Use first video as fallback if no merged video
        mergedVideoUrl = scenes.length > 0 && scenes[0]?.videoUrl ? scenes[0].videoUrl : null
      }
    }
    
    // Build results object - for continuous video: return only merged video URL
    const results = {
      storyboard: storyboard,
      // Return merged video URL as primary video_url (hide individual clips from user)
      video_url: mergedVideoUrl,
      merged_video_url: mergedVideoUrl,
      // Keep scenes for internal reference but don't expose individual URLs
      scenes: Array.isArray(individualScenes) ? individualScenes.map(scene => ({
        sceneIndex: scene.sceneIndex,
        sceneNumber: scene.sceneNumber,
        description: scene.description,
        duration: scene.duration,
        // Don't expose individual video URLs - only merged video
        videoUrl: null, // Hidden from user
        generationId: scene.generationId || null,
        error: scene.error || null
      })) : [],
      scenes_count: Array.isArray(individualScenes) ? individualScenes.length : (job.scenes_count || 0)
    }
    
    // Return job status
    return NextResponse.json({
      jobId: job.job_id,
      status: job.status,
      progress: job.progress || 0,
      currentStep: job.current_step || '',
      scenesCount: job.scenes_count || 0,
      results: results,
      error: job.error_message || null,
      errorDetails: errorDetails,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at
    })
    
  } catch (error) {
    console.error('[Job API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error.message
      },
      { status: 500 }
    )
  }
}
