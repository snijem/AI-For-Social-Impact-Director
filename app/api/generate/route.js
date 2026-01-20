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
    if (!script || script.trim().length < 2) {
      return NextResponse.json(
        { error: "Script must be at least 2 characters long" },
        { status: 400 }
      )
    }
    
    // Get current user (required for lives check)
    let user = null
    try {
      user = await getCurrentUser(req)
    } catch (authError) {
      // Continue without user if not authenticated
    }
    
    // Check user's remaining points if authenticated
    // Points system: 1 life = 100 points, 3 lives = 300 points total
    // Each video costs 100 points (1 life)
    const POINTS_PER_LIFE = 100
    const COST_PER_VIDEO = 100
    
    if (user) {
      try {
        const users = await queryDB(
          'SELECT lives_remaining FROM users WHERE id = ?',
          [user.id]
        )
        
        if (users && users.length > 0) {
          const livesRemaining = users[0].lives_remaining ?? 3
          const pointsRemaining = livesRemaining * POINTS_PER_LIFE
          
          if (pointsRemaining < COST_PER_VIDEO) {
            return NextResponse.json(
              { 
                error: `Insufficient points. You need ${COST_PER_VIDEO} points to generate a video. You have ${pointsRemaining}/300 points remaining.`,
                lives_remaining: livesRemaining,
                points_remaining: pointsRemaining,
                cost_per_video: COST_PER_VIDEO,
              },
              { status: 403 }
            )
          }
        }
      } catch (livesError) {
        // If column doesn't exist or error, allow generation (graceful degradation)
        console.error('Error checking points:', livesError)
      }
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
      script: "string (minimum 2 characters)"
    },
    response: {
      jobId: "string - Use this to poll job status",
      status: "queued",
      message: "string"
    },
    pollingEndpoint: "/api/job/:jobId"
  })
}
