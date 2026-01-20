import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { queryDB } from '../../../../lib/db'
import { logLivesChange } from '../../../../lib/lives-logger'

/**
 * GET /api/user/lives
 * Get the current user's remaining lives
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Points system: 1 life = 100 points, 3 lives = 300 points total
    const POINTS_PER_LIFE = 100
    const DEFAULT_POINTS = 300 // 3 lives × 100 points
    
    // Declare variables outside try block so they're accessible in catch block
    let livesRemaining = 3 // Default lives
    let pointsRemaining = DEFAULT_POINTS // Default points
    
    try {
      const users = await queryDB(
        'SELECT lives_remaining FROM users WHERE id = ?',
        [user.id]
      )
      
      if (users && users.length > 0) {
        // Check if column exists (might be null if column doesn't exist)
        if (users[0].hasOwnProperty('lives_remaining')) {
          livesRemaining = users[0].lives_remaining ?? 3
          // Convert lives to points: points = lives × 100
          pointsRemaining = livesRemaining * POINTS_PER_LIFE
        } else {
          // Column doesn't exist yet, use defaults
          livesRemaining = 3
          pointsRemaining = DEFAULT_POINTS
        }
      }
    } catch (dbError) {
      // If column doesn't exist, return default value
      if (dbError.message?.includes('lives_remaining') || dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('lives_remaining column not found, using default value')
        livesRemaining = 3
        pointsRemaining = DEFAULT_POINTS
      } else {
        // Other database error, log it
        console.error('Database error fetching lives:', dbError.message)
        livesRemaining = 3
        pointsRemaining = DEFAULT_POINTS
      }
    }

    return NextResponse.json({
      lives_remaining: livesRemaining,
      points_remaining: pointsRemaining,
      points_per_life: POINTS_PER_LIFE,
      total_points: DEFAULT_POINTS,
      user_id: user.id
    })
  } catch (error) {
    console.error('Error fetching user lives:', error)
    // Return default value instead of error to prevent UI breakage
    return NextResponse.json({
      lives_remaining: 3,
      error: 'Could not fetch lives, using default'
    }, { status: 200 })
  }
}

/**
 * POST /api/user/lives
 * Decrement user's points (used when generating a video)
 * Body: { decrement_points: number } (default: 100) or { decrement: number } for backward compatibility
 * Each video costs 100 points (1 life)
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    // Support both decrement_points (new) and decrement (old) for backward compatibility
    const pointsToDeduct = body.decrement_points ?? (body.decrement ?? 1) * 100
    const POINTS_PER_LIFE = 100
    const DEFAULT_POINTS = 300

    // Get current lives
    const users = await queryDB(
      'SELECT lives_remaining FROM users WHERE id = ?',
      [user.id]
    )

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentLives = users[0].lives_remaining ?? 3
    const currentPoints = currentLives * POINTS_PER_LIFE
    
    // Calculate new points (ensure we don't go below 0)
    const newPoints = Math.max(0, currentPoints - pointsToDeduct)
    // Convert back to lives (round down)
    const newLives = Math.floor(newPoints / POINTS_PER_LIFE)

    // Update lives in database (stored as lives, but we think in points)
    await queryDB(
      'UPDATE users SET lives_remaining = ? WHERE id = ?',
      [newLives, user.id]
    )

    // Log the lives change
    await logLivesChange({
      userId: user.id,
      previousLives: currentLives,
      newLives: newLives,
      actionType: 'decrement',
      reason: `Video generation (${pointsToDeduct} points deducted)`,
      relatedJobId: body.job_id || null
    })

    return NextResponse.json({
      lives_remaining: newLives,
      points_remaining: newPoints,
      previous_lives: currentLives,
      previous_points: currentPoints,
      points_deducted: pointsToDeduct,
      points_per_life: POINTS_PER_LIFE,
      total_points: DEFAULT_POINTS
    })
  } catch (error) {
    console.error('Error updating user lives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

