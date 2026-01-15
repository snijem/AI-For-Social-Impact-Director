import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Get a specific video
export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const videoId = params.id
    const videos = await queryDB(
      `SELECT id, script, video_url, generation_id, status, storyboard, video_data, created_at, updated_at 
       FROM user_videos 
       WHERE id = ? AND user_id = ?`,
      [videoId, user.id]
    )

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    const video = videos[0]
    return NextResponse.json({
      video: {
        ...video,
        storyboard: video.storyboard ? JSON.parse(video.storyboard) : null,
        videoData: video.video_data ? JSON.parse(video.video_data) : null,
      },
    })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}

// Update a video
export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const videoId = params.id
    const { script, videoUrl, generationId, status, storyboard, videoData } = await req.json()

    // Verify video belongs to user
    const existing = await queryDB(
      'SELECT id FROM user_videos WHERE id = ? AND user_id = ?',
      [videoId, user.id]
    )

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    await queryDB(
      `UPDATE user_videos 
       SET script = ?, video_url = ?, generation_id = ?, status = ?, storyboard = ?, video_data = ?
       WHERE id = ? AND user_id = ?`,
      [
        script || existing[0].script,
        videoUrl !== undefined ? videoUrl : existing[0].video_url,
        generationId !== undefined ? generationId : existing[0].generation_id,
        status || existing[0].status,
        storyboard ? JSON.stringify(storyboard) : existing[0].storyboard,
        videoData ? JSON.stringify(videoData) : existing[0].video_data,
        videoId,
        user.id,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}
