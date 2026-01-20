import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAllLivesLogs, getUserLivesLog } from '@/lib/lives-logger'

export const dynamic = 'force-dynamic'

// Hardcoded list of admin emails (normalized to lowercase)
const ADMIN_EMAILS = [
  'mnijem18@gmail.com',
  'salab261@gmail.com',
  // Add more admin emails here
].map(email => email.toLowerCase().trim())

// Check if user is admin
function isAdmin(user) {
  if (!user || !user.email) return false
  const normalizedUserEmail = user.email.toLowerCase().trim()
  return ADMIN_EMAILS.includes(normalizedUserEmail)
}

/**
 * GET /api/admin/lives-logs
 * Get lives logs (admin only)
 * Query params: userId (optional) - filter by user ID
 */
export async function GET(req) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Fetch logs
    const logs = userId 
      ? await getUserLivesLog(parseInt(userId), limit)
      : await getAllLivesLogs(limit)

    return NextResponse.json({
      success: true,
      logs: logs,
      count: logs.length
    })
  } catch (error) {
    console.error('Admin lives logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lives logs', details: error.message },
      { status: 500 }
    )
  }
}
