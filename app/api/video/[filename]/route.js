import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * GET /api/video/[filename]
 * Serves merged video files from public/merged-videos/
 */
export async function GET(req, { params }) {
  try {
    const { filename } = params
    
    if (!filename || !filename.endsWith('.mp4')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'merged-videos', filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (error) {
      console.error(`[Video API] File not found: ${filePath}`)
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    const stats = await fs.stat(filePath)

    // Return video with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[Video API] Error serving video:', error)
    return NextResponse.json(
      { error: 'Failed to serve video', details: error.message },
      { status: 500 }
    )
  }
}
