import { NextResponse } from "next/server";
import { queryDB } from '../../../lib/db'
import { setupDatabase } from '../../../lib/setup-db'
import { getCurrentUser } from '../../../lib/auth'
import { processGenerationJob } from '../../../lib/video-worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Quick response, processing happens in background

/**
 * POST /api/generate
 * Creates a generation job and returns immediately with jobId
 */
export async function POST(req) {
  try {
    // Ensure database is set up
    await setupDatabase()
    
    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON with 'script' field." },
        { status: 400 }
      )
    }
    
    const { script } = body
    
    // Validate script
    if (!script || script.trim().length < 60) {
      return NextResponse.json(
        { error: "Script must be at least 60 characters long" },
        { status: 400 }
      )
    }
    
    // Get current user (optional - job can work without auth)
    let user = null
    try {
      user = await getCurrentUser()
    } catch (authError) {
      // Continue without user if not authenticated
    }
    
    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Create job record in database
    await queryDB(
      `INSERT INTO generation_jobs 
       (job_id, user_id, script, status, progress, current_step, scenes_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        user?.id || null,
        script.trim(),
        'queued',
        0,
        'Job queued...',
        0
      ]
    )
    
    // Start background processing (don't await - fire and forget)
    processGenerationJob(jobId).catch(error => {
      console.error(`[Generate API] Background job error for ${jobId}:`, error)
    })
    
    // Return immediately with jobId
    return NextResponse.json({
      success: true,
      jobId: jobId,
      status: 'queued',
      message: 'Generation job created. Poll /api/job/:jobId for status.'
    })
    
  } catch (error) {
    console.error('[Generate API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create generation job',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/generate
 * Returns API information
 */
export async function GET() {
  return NextResponse.json({
    message: "Video Generation API",
    method: "Use POST to create a generation job",
    endpoint: "/api/generate",
    requiredBody: {
      script: "string (minimum 60 characters)"
    },
    response: {
      jobId: "string - Use this to poll job status",
      status: "queued",
      message: "string"
    },
    pollingEndpoint: "/api/job/:jobId"
  })
}
