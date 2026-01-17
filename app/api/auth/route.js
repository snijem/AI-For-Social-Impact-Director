import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Ensure database tables exist (fail silently if DB not available)
    try {
      await setupDatabase()
    } catch (setupError) {
      // Log but don't fail - database might not be configured yet
      if (setupError.code === 'ER_ACCESS_DENIED_ERROR' || setupError.code === 'ER_ACCESS_DENIED') {
        console.error('Database access denied. Check credentials in .env.local')
      } else if (setupError.code === 'ECONNREFUSED') {
        console.error('Database connection refused. Is MySQL running?')
      } else {
        console.error('Database setup error:', setupError.message)
      }
    }

    // Try to get current user (may fail if DB not available)
    let user = null
    try {
      user = await getCurrentUser()
    } catch (authError) {
      // If database is not available, return not authenticated
      if (authError.code === 'ER_ACCESS_DENIED_ERROR' || 
          authError.code === 'ECONNREFUSED' ||
          authError.message?.includes('Database')) {
        return NextResponse.json({ 
          authenticated: false,
          message: 'Database not available'
        }, { status: 200 })
      }
      // Re-throw other errors
      throw authError
    }
    
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        age: user.age,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
