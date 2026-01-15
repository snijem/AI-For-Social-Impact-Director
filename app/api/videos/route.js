import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryDB } from '@/lib/db'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

// Get all videos for current user
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

    const videos = await queryDB(
      `SELECT id, script, video_url, generation_id, status, storyboard, video_data, created_at, updated_at 
       FROM user_videos 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ videos: videos || [] })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// Save a new video/project
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

    const { script, videoUrl, generationId, status, storyboard, videoData } = await req.json()

    if (!script || script.trim().length < 10) {
      return NextResponse.json(
        { error: 'Script is required and must be at least 10 characters' },
        { status: 400 }
      )
    }

    const result = await queryDB(
      `INSERT INTO user_videos (user_id, script, video_url, generation_id, status, storyboard, video_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        script.trim(),
        videoUrl || null,
        generationId || null,
        status || 'draft',
        storyboard ? JSON.stringify(storyboard) : null,
        videoData ? JSON.stringify(videoData) : null,
      ]
    )

    return NextResponse.json({
      success: true,
      videoId: result.insertId,
    })
  } catch (error) {
    console.error('Error saving video:', error)
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    )
  }
}
