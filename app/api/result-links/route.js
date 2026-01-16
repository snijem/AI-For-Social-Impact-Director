import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryDB } from '@/lib/db'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

// Get all result links for current user
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

    const links = await queryDB(
      `SELECT id, video_id, result_url, title, description, status, created_at, updated_at 
       FROM result_links 
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ links: links || [] })
  } catch (error) {
    console.error('Error fetching result links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch result links' },
      { status: 500 }
    )
  }
}

// Save a new result link
export async function POST(req) {
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

    const { resultUrl, videoId, title, description } = await req.json()

    if (!resultUrl || resultUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'Result URL is required' },
        { status: 400 }
      )
    }

    const result = await queryDB(
      `INSERT INTO result_links (user_id, video_id, result_url, title, description, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        user.id,
        videoId || null,
        resultUrl.trim(),
        title || null,
        description || null,
      ]
    )

    return NextResponse.json({
      success: true,
      linkId: result.insertId,
    })
  } catch (error) {
    console.error('Error saving result link:', error)
    return NextResponse.json(
      { error: 'Failed to save result link' },
      { status: 500 }
    )
  }
}

