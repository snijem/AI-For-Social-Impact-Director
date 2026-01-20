import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryDB } from '@/lib/db'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

// Hardcoded list of admin emails
const ADMIN_EMAILS = [
  'mnijem18@gmail.com', // Replace with your actual admin email
  // Add more admin emails here
]

// Check if user is admin
function isAdmin(user) {
  if (!user || !user.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
}

// GET /api/admin/users - Get all users (admin only)
export async function GET() {
  try {
    // Ensure database tables exist
    await setupDatabase()

    // Check authentication
    const user = await getCurrentUser()
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

    // Fetch all users
    const users = await queryDB(`
      SELECT 
        id,
        full_name,
        email,
        phone,
        age,
        country,
        lives_remaining,
        status,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      success: true,
      users: users || [],
    })
  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}
