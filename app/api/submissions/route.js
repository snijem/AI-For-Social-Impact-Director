import { NextResponse } from 'next/server'
import { queryDB } from '../../../lib/db'
import { getCurrentUser } from '../../../lib/auth'
import { setupDatabase } from '../../../lib/setup-db'

export const dynamic = 'force-dynamic'

// Submit a new script
export async function POST(req) {
  try {
    await setupDatabase()
    
    const user = await getCurrentUser(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { script } = await req.json()

    if (!script || script.trim().length < 2) {
      return NextResponse.json(
        { error: 'Script must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Update the ENUM to include 'submitted' if it doesn't exist
    try {
      await queryDB(`
        ALTER TABLE user_videos 
        MODIFY COLUMN status ENUM('draft', 'processing', 'completed', 'failed', 'submitted') DEFAULT 'draft'
      `)
    } catch (alterError) {
      // If ALTER fails (e.g., column already has the value), continue
      console.log('Note: Could not modify status ENUM (may already be updated):', alterError.message)
    }
    
    // Save submission to user_videos table with status 'submitted'
    const result = await queryDB(
      `INSERT INTO user_videos (user_id, script, status, created_at) 
       VALUES (?, ?, 'submitted', NOW())`,
      [user.id, script.trim()]
    )

    return NextResponse.json({
      success: true,
      message: 'Script submitted successfully',
      submissionId: result.insertId,
    })

  } catch (error) {
    console.error('Error submitting script:', error)
    // Return the actual error message in the error field, not a generic message
    const errorMessage = error.message || 'An unexpected error occurred'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Get all submissions (admin only)
export async function GET(req) {
  try {
    await setupDatabase()
    
    const user = await getCurrentUser(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin (you can implement proper admin check here)
    // For now, we'll check if email contains 'admin' or is in a list
    const ADMIN_EMAILS = ['mnijem18@gmail.com', 'salab261@gmail.com']
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase().trim())

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    // Get all submitted scripts
    const submissions = await queryDB(
      `SELECT 
        uv.id,
        uv.user_id,
        uv.script,
        uv.status,
        uv.created_at,
        u.full_name,
        u.email,
        u.age,
        u.country
       FROM user_videos uv
       JOIN users u ON uv.user_id = u.id
       WHERE uv.status = 'submitted'
       ORDER BY uv.created_at DESC`
    )

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      count: submissions?.length || 0,
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: error.message },
      { status: 500 }
    )
  }
}

