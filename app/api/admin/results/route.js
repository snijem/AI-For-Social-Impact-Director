import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryDB } from '@/lib/db'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = [
  'mnijem18@gmail.com',
  'salab261@gmail.com',
]

function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email.toLowerCase())
}

export async function GET() {
  try {
    // Ensure database tables exist
    try {
      await setupDatabase()
    } catch (setupError) {
      console.error('Database setup error:', setupError)
    }

    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Fetch all videos with user information
    const results = await queryDB(`
      SELECT 
        uv.id,
        uv.script,
        uv.video_url,
        uv.generation_id,
        uv.status,
        uv.storyboard,
        uv.video_data,
        uv.created_at,
        uv.updated_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone
      FROM user_videos uv
      INNER JOIN users u ON uv.user_id = u.id
      ORDER BY uv.created_at DESC
    `)

    return NextResponse.json({ results: results || [] })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
