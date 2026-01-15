import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * Simple health check endpoint - should always work
 */
export async function GET(request) {
  // Wrap in try-catch to ensure we always return JSON
  try {
    const response = {
      status: 'ok',
      service: 'Next.js API',
      timestamp: new Date().toISOString(),
    }

    // Try to get uptime, but don't fail if it doesn't exist
    try {
      response.uptime = process.uptime()
    } catch (e) {
      response.uptime = 0
    }

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    // Even if everything fails, return JSON
    const errorResponse = {
      status: 'error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
