import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryDB } from '@/lib/db'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

// Hardcoded list of admin emails
const ADMIN_EMAILS =  [
  'mnijem18@gmail.com',
  'salab261@gmail.com', // Replace with your actual admin email
  // Add more admin emails here
]
// Check if user is admin
function isAdmin(user) {
  if (!user || !user.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
}

// PUT /api/admin/users/[userId]/lives - Update user lives (admin only)
export async function PUT(req, { params }) {
  try {
    // Ensure database tables exist
    await setupDatabase()

    // Check authentication
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    const userId = params.userId
    const { lives_remaining } = await req.json()

    // Validate input
    if (lives_remaining === undefined || lives_remaining === null) {
      return NextResponse.json(
        { error: 'lives_remaining is required' },
        { status: 400 }
      )
    }

    const livesValue = parseInt(lives_remaining)
    if (isNaN(livesValue) || livesValue < 0) {
      return NextResponse.json(
        { error: 'lives_remaining must be a non-negative integer' },
        { status: 400 }
      )
    }

    // Check if user exists
    const users = await queryDB('SELECT id, email, full_name FROM users WHERE id = ?', [userId])
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user lives
    await queryDB(
      'UPDATE users SET lives_remaining = ? WHERE id = ?',
      [livesValue, userId]
    )

    return NextResponse.json({
      success: true,
      message: `Lives updated successfully for ${users[0].email}`,
      user: {
        id: users[0].id,
        email: users[0].email,
        full_name: users[0].full_name,
        lives_remaining: livesValue,
      },
    })
  } catch (error) {
    console.error('Admin update lives error:', error)
    return NextResponse.json(
      { error: 'Failed to update user lives', details: error.message },
      { status: 500 }
    )
  }
}
