import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { queryDB } from '../../../../lib/db'

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

    // Try to get user's lives_remaining from database
    let livesRemaining = 3 // Default value
    
    try {
      const users = await queryDB(
        'SELECT lives_remaining FROM users WHERE id = ?',
        [user.id]
      )

      if (users && users.length > 0) {
        // Check if column exists (might be null if column doesn't exist)
        if (users[0].hasOwnProperty('lives_remaining')) {
          livesRemaining = users[0].lives_remaining ?? 3
        } else {
          // Column doesn't exist yet, use default
          livesRemaining = 3
        }
      }
    } catch (dbError) {
      // If column doesn't exist, return default value
      if (dbError.message?.includes('lives_remaining') || dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('lives_remaining column not found, using default value of 3')
        livesRemaining = 3
      } else {
        // Other database error, log it
        console.error('Database error fetching lives:', dbError.message)
        // Still return default value to prevent breaking the UI
        livesRemaining = 3
      }
    }

    return NextResponse.json({
      lives_remaining: livesRemaining,
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
 * Decrement user's lives (used when generating a video)
 * Body: { decrement: number } (default: 1)
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
    const decrement = body.decrement ?? 1

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
    const newLives = Math.max(0, currentLives - decrement)

    // Update lives in database
    await queryDB(
      'UPDATE users SET lives_remaining = ? WHERE id = ?',
      [newLives, user.id]
    )

    return NextResponse.json({
      lives_remaining: newLives,
      previous_lives: currentLives,
      decremented: decrement
    })
  } catch (error) {
    console.error('Error updating user lives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

